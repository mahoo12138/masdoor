// Copyright 2023 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package object

import (
	"errors"
	"fmt"
	"strings"

	"github.com/mahoo12138/masdoor/conf"
	"github.com/mahoo12138/masdoor/i18n"
	"github.com/mahoo12138/masdoor/util"
	"github.com/xorm-io/builder"
	"github.com/xorm-io/core"
)

type Group struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk index" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	DisplayName  string   `xorm:"varchar(100)" json:"displayName"`
	Manager      string   `xorm:"varchar(100)" json:"manager"`
	ContactEmail string   `xorm:"varchar(100)" json:"contactEmail"`
	Type         string   `xorm:"varchar(100)" json:"type"`
	ParentId     string   `xorm:"varchar(100)" json:"parentId"`
	ParentName   string   `xorm:"-" json:"parentName"`
	IsTopGroup   bool     `xorm:"bool" json:"isTopGroup"`
	Users        []string `xorm:"-" json:"users"`

	Title        string   `json:"title,omitempty"`
	Key          string   `json:"key,omitempty"`
	HaveChildren bool     `xorm:"-" json:"haveChildren"`
	Children     []*Group `json:"children,omitempty"`

	IsEnabled bool `json:"isEnabled"`
	// GidNumber is the POSIX gid published by the built-in LDAP server, 0 when unassigned.
	GidNumber  int               `xorm:"index" json:"gidNumber"`
	Properties map[string]string `xorm:"mediumtext" json:"properties"`
}

type GroupNode struct{}

func GetGroupCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	count, err := session.Count(&Group{})
	if err != nil {
		return 0, err
	}

	return count, nil
}

func GetGroups(owner string) ([]*Group, error) {
	groups := []*Group{}
	err := ormer.Engine.Desc("created_time").Find(&groups, &Group{Owner: owner})
	if err != nil {
		return nil, err
	}

	return groups, nil
}

func GetGlobalGroups() ([]*Group, error) {
	groups := []*Group{}
	err := ormer.Engine.Desc("created_time").Find(&groups)
	if err != nil {
		return nil, err
	}

	return groups, nil
}

func GetPaginationGroups(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Group, error) {
	groups := []*Group{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&groups)
	if err != nil {
		return nil, err
	}

	return groups, nil
}

func GetGroupCountWithFilter(owner string, cond builder.Cond) (int64, error) {
	session := GetSession(owner, -1, -1, "", "", "", "")
	return session.And(cond).Count(&Group{})
}

func GetPaginationGroupsWithFilter(owner string, offset, limit int, cond builder.Cond) ([]*Group, error) {
	groups := []*Group{}
	session := GetSession(owner, offset, limit, "", "", "", "")
	err := session.And(cond).Find(&groups)
	if err != nil {
		return nil, err
	}
	return groups, nil
}

// GetGroupsParentMap returns the parent group of each given group, keyed by the parent's ID.
func GetGroupsParentMap(groups []*Group) (map[string]*Group, error) {
	resultMap := make(map[string]*Group)

	groupNames := []string{}
	for _, group := range groups {
		if !group.IsTopGroup {
			groupNames = append(groupNames, group.ParentId)
		}
	}
	if len(groupNames) == 0 {
		return resultMap, nil
	}

	parentGroups := []*Group{}
	err := ormer.Engine.Cols("owner", "name", "parent_id", "display_name").In("name", groupNames).Find(&parentGroups)
	if err != nil {
		return nil, err
	}

	for _, group := range parentGroups {
		resultMap[group.GetId()] = group
	}
	return resultMap, nil
}

// GetGroupIdsHaveChildren returns the IDs of the given groups that have at least one subgroup.
func GetGroupIdsHaveChildren(groups []*Group) (map[string]bool, error) {
	resultMap := make(map[string]bool)

	groupNames := []string{}
	for _, group := range groups {
		groupNames = append(groupNames, group.Name)
	}
	if len(groupNames) == 0 {
		return resultMap, nil
	}

	childGroups := []*Group{}
	err := ormer.Engine.Cols("owner", "parent_id").In("parent_id", groupNames).Find(&childGroups)
	if err != nil {
		return nil, err
	}

	for _, group := range childGroups {
		resultMap[fmt.Sprintf("%s/%s", group.Owner, group.ParentId)] = true
	}
	return resultMap, nil
}

func getGroup(owner string, name string) (*Group, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	group := Group{Owner: owner, Name: name}
	existed, err := ormer.Engine.Get(&group)
	if err != nil {
		return nil, err
	}

	if existed {
		return &group, nil
	} else {
		return nil, nil
	}
}

func GetGroup(id string) (*Group, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return nil, err
	}
	return getGroup(owner, name)
}

func UpdateGroup(id string, group *Group, isGlobalAdmin bool, lang string) (bool, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return false, err
	}
	oldGroup, err := getGroup(owner, name)
	if oldGroup == nil {
		return false, err
	}

	if !isGlobalAdmin && oldGroup.Owner != group.Owner {
		return false, errors.New(i18n.Translate(lang, "auth:Unauthorized operation"))
	}

	err = checkGroupName(group.Name)
	if err != nil {
		return false, err
	}

	if name != group.Name {
		err := GroupChangeTrigger(owner, name, group.Name)
		if err != nil {
			return false, err
		}
	}

	affected, err := ormer.Engine.ID(core.PK{owner, name}).AllCols().Update(group)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddGroup(group *Group) (bool, error) {
	err := checkGroupName(group.Name)
	if err != nil {
		return false, err
	}

	affected, err := ormer.Engine.Insert(group)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddGroups(groups []*Group) (bool, error) {
	if len(groups) == 0 {
		return false, nil
	}
	affected, err := ormer.Engine.Insert(groups)
	if err != nil {
		return false, err
	}
	return affected != 0, nil
}

func AddGroupsInBatch(groups []*Group) (bool, error) {
	if len(groups) == 0 {
		return false, nil
	}

	session := ormer.Engine.NewSession()
	defer session.Close()
	err := session.Begin()
	if err != nil {
		return false, err
	}

	for _, group := range groups {
		err = checkGroupName(group.Name)
		if err != nil {
			return false, err
		}

		affected, err := session.Insert(group)
		if err != nil {
			return false, err
		}
		if affected == 0 {
			return false, nil
		}
	}

	err = session.Commit()
	if err != nil {
		return false, err
	}

	return true, nil
}

func deleteGroup(group *Group) (bool, error) {
	affected, err := ormer.Engine.ID(core.PK{group.Owner, group.Name}).Delete(&Group{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteGroup(group *Group) (bool, error) {
	_, err := ormer.Engine.Get(group)
	if err != nil {
		return false, err
	}

	if count, err := ormer.Engine.Where("owner = ?", group.Owner).And("parent_id = ?", group.Name).Count(&Group{}); err != nil {
		return false, err
	} else if count > 0 {
		return false, errors.New("group has children group")
	}

	if count, err := GetGroupUserCount(group.GetId(), "", ""); err != nil {
		return false, err
	} else if count > 0 {
		return false, errors.New("group has users")
	}

	return deleteGroup(group)
}

func checkGroupName(name string) error {
	if name == "" {
		return errors.New("group name can't be empty")
	}
	if strings.Contains(name, "/") {
		return errors.New("group name can't contain \"/\"")
	}
	exist, err := ormer.Engine.Exist(&Organization{Owner: "admin", Name: name})
	if err != nil {
		return err
	}
	if exist {
		return errors.New("group name can't be same as the organization name")
	}
	return nil
}

func (group *Group) GetId() string {
	return fmt.Sprintf("%s/%s", group.Owner, group.Name)
}

func ConvertToTreeData(groups []*Group, parentId string) []*Group {
	treeData := []*Group{}

	for _, group := range groups {
		if group.ParentId == parentId {
			node := &Group{
				Title:       group.DisplayName,
				Key:         group.Name,
				Type:        group.Type,
				Owner:       group.Owner,
				Name:        group.Name,
				DisplayName: group.DisplayName,
			}
			children := ConvertToTreeData(groups, group.Name)
			if len(children) > 0 {
				node.Children = children
			}
			treeData = append(treeData, node)
		}
	}
	return treeData
}

func GetGroupUserCount(groupId string, field, value string) (int64, error) {
	owner, _, err := util.GetOwnerAndNameFromIdWithError(groupId)
	if err != nil {
		return 0, err
	}
	names, err := getGroupMemberNames(groupId)
	if err != nil {
		return 0, err
	}

	if field == "" && value == "" {
		return int64(len(names)), nil
	} else {
		tableNamePrefix := conf.GetConfigString("tableNamePrefix")
		session := ormer.Engine.Table(tableNamePrefix+"user").
			Where("owner = ?", owner).In("name", names)
		if util.FilterField(field) {
			session = session.And(fmt.Sprintf("user.%s like ?", util.CamelToSnakeCase(field)), "%"+value+"%")
		}
		return session.Count()
	}
}

func GetPaginationGroupUsers(groupId string, offset, limit int, field, value, sortField, sortOrder string) ([]*User, error) {
	users := []*User{}
	owner, _, err := util.GetOwnerAndNameFromIdWithError(groupId)
	if err != nil {
		return nil, err
	}
	names, err := getGroupMemberNames(groupId)
	if err != nil {
		return nil, err
	}

	tableNamePrefix := conf.GetConfigString("tableNamePrefix")
	prefixedUserTable := tableNamePrefix + "user"
	session := ormer.Engine.Table(prefixedUserTable).
		Where("owner = ?", owner).In("name", names)

	if offset != -1 && limit != -1 {
		session.Limit(limit, offset)
	}

	if field != "" && value != "" && util.FilterField(field) {
		session = session.And(fmt.Sprintf("%s.%s like ?", prefixedUserTable, util.CamelToSnakeCase(field)), "%"+value+"%")
	}

	if sortField == "" || sortOrder == "" || !util.FilterField(sortField) {
		sortField = "created_time"
	}

	orderQuery := fmt.Sprintf("%s.%s", prefixedUserTable, util.CamelToSnakeCase(sortField))

	if sortOrder == "ascend" {
		session = session.Asc(orderQuery)
	} else {
		session = session.Desc(orderQuery)
	}

	err = session.Find(&users)
	if err != nil {
		return nil, err
	}

	return users, nil
}

// getGroupMembers returns the users whose Groups field lists the group. The
// membership only exists on the user row, so the reverse lookup reads the users
// table: the LIKE clause is a coarse pre-filter ("built-in/a" would also match
// "built-in/ab"), the exact check happens on the decoded list.
func getGroupMembers(groupId string) ([]*User, error) {
	owner, _, err := util.GetOwnerAndNameFromIdWithError(groupId)
	if err != nil {
		return nil, err
	}

	candidates := []*User{}
	err = ormer.Engine.Where("owner = ?", owner).And(builder.Like{"`groups`", groupId}).Find(&candidates)
	if err != nil {
		return nil, err
	}

	members := make([]*User, 0, len(candidates))
	for _, user := range candidates {
		if util.InSlice(user.Groups, groupId) {
			members = append(members, user)
		}
	}
	return members, nil
}

func getGroupMemberNames(groupId string) ([]string, error) {
	members, err := getGroupMembers(groupId)
	if err != nil {
		return nil, err
	}

	names := make([]string, 0, len(members))
	for _, user := range members {
		names = append(names, user.Name)
	}
	return names, nil
}

func getGroupMemberIds(groupId string) ([]string, error) {
	members, err := getGroupMembers(groupId)
	if err != nil {
		return nil, err
	}

	userIds := make([]string, 0, len(members))
	for _, user := range members {
		userIds = append(userIds, user.GetId())
	}
	return userIds, nil
}

func GetGroupUsers(groupId string) ([]*User, error) {
	return getGroupMembers(groupId)
}

func GetGroupUsersWithoutError(groupId string) []*User {
	users, _ := GetGroupUsers(groupId)
	return users
}

func ExtendGroupWithUsers(group *Group) error {
	if group == nil {
		return nil
	}

	userIds, err := getGroupMemberIds(group.GetId())
	if err != nil {
		return err
	}

	group.Users = userIds
	return nil
}

func ExtendGroupsWithUsers(groups []*Group) error {
	if len(groups) == 0 {
		return nil
	}

	for _, group := range groups {
		userIds, err := getGroupMemberIds(group.GetId())
		if err != nil {
			return err
		}

		group.Users = userIds
	}
	return nil
}

func GroupChangeTrigger(owner string, oldName string, newName string) error {
	session := ormer.Engine.NewSession()
	defer session.Close()
	err := session.Begin()
	if err != nil {
		return err
	}

	oldGroupId := util.GetId(owner, oldName)
	newGroupId := util.GetId(owner, newName)

	users := []*User{}
	err = session.Where("owner = ?", owner).And(builder.Like{"`groups`", oldGroupId}).Find(&users)
	if err != nil {
		return err
	}

	for _, user := range users {
		user.Groups = util.ReplaceVal(user.Groups, oldGroupId, newGroupId)
		_, err := updateUser(user.GetId(), user, []string{"groups"})
		if err != nil {
			return err
		}
	}

	groups := []*Group{}
	err = session.Where("owner = ?", owner).And("parent_id = ?", oldName).Find(&groups)
	if err != nil {
		return err
	}
	for _, group := range groups {
		group.ParentId = newName
		_, err := session.ID(core.PK{group.Owner, group.Name}).Cols("parent_id").Update(group)
		if err != nil {
			return err
		}
	}

	err = session.Commit()
	if err != nil {
		return err
	}
	return nil
}
