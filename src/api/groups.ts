
import _ from "lodash";

import { RunState } from "../cli/state";
import { configAxios } from ".";

export interface Group {
  _id: string;

  id: string;
  active: boolean;
  emailable: boolean;
  signatures: string[];
  signatories: string[];
  readers: string[];
  writers: string[];
  nonreaders: string[];
  members: string[];

  cdate: number;
  ddate: number;
  tmdate: number;
  tddate: number;
  tcdate: number;

  tauthor: string;
  web: string;
}

export async function listGroups(runState: RunState): Promise<void> {
  console.log("listGroups");
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
              console.log(k, v);
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
