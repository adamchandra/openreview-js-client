
import _ from "lodash";

import { RunState } from "../cli/state";
import { configAxios } from ".";
import { AxiosError } from "axios";

export interface GroupPermissions {
  signatures: string[];
  signatories: string[];
  readers: string[];
  writers: string[];
  nonreaders: string[];
  members: string[];
}

export interface Group extends GroupPermissions {
  _id: string;

  id: string;
  active: boolean;
  emailable: boolean;

  cdate: number;
  ddate: number;
  tmdate: number;
  tddate: number;
  tcdate: number;

  tauthor: string;
  web: string;
}

type CreatedGroup = any;

export function createGroup(groupId: string, runState: RunState): Promise<CreatedGroup> {

  return configAxios(runState)
    .post("/groups", {
      id: groupId
    }).catch((error: AxiosError) => {
      console.log(error.message);
    });
}

export async function deleteGroup(runState: RunState): Promise<void> {
}

export async function showGroupTree(runState: RunState): Promise<void> {
}

export async function listGroups(runState: RunState): Promise<void> {
  const axios = configAxios(runState);

  axios.get("/groups")
    .then((r: any) => {
      const groups = r.data.groups;
      console.log("total #", groups.length);
      const uniqKeys = _.uniq(
        _.map(groups, (group: object) => {
          const kvlist = _.map(_.toPairs(group), ([k, v]) => {
            const vtype = typeof v;
            if (k === "web" && v) {
              // console.log(k, v);
            }
            return `${k}: ${vtype}`;
          });
          // console.log(group);
          return _.join(kvlist, "; ");
        })
      );

      console.log(_.join(uniqKeys, "\n"));
    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
}
