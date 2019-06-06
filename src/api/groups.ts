import _ from "lodash";

import { prettyPrint } from "../lib/utils";
import { RunState } from "../cli/state";
import { configAxios } from ".";
import { AxiosError } from "axios";

import Trie from "mnemonist/trie";

export interface GroupPermissions {
  signatures: string[];
  signatories: string[];
  readers: string[];  // always
  nonreaders: string[]; // always
  writers: string[];
  members: string[];
}



export interface Group extends GroupPermissions {
  _id: string; // not everywhere

  id: string; // always
  active: boolean; // occasionally
  emailable: boolean; // sometimes

  cdate: number; // usually
  ddate: number; // usually, but a bit less than the others (ACS: also, why object type not number?)
  tmdate: number; // usually
  tddate: number; // usually
  tcdate: number; // usually ACS: also, why object type not number?

  tauthor: string; // usually
  web: string;
}

type CreatedGroup = any;

export async function createGroup(groupId: string, runState: RunState): Promise<CreatedGroup> {

  return configAxios(runState)
    .post("/groups", {
      id: groupId
    }).catch((error: AxiosError) => {
      console.log(error.message);
    });
}

export async function deleteGroup(runState: RunState): Promise<void> {
}



export async function queryGroups(runState: RunState): Promise<void> {

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


      const trie = new Trie();
      _.each(groups, (g) => {

        const groupId: string = g.id;
        const parts = groupId.split("/");
        const subgroups = _.map(
          _.range(parts.length), (i) => _.join(parts.slice(0, i+1), "/")
        );
        // console.log('parts', subgroups);
        _.each(subgroups, sg => {
          // console.log('adding', sg);
          trie.add(sg);
        });
      });
      const root = (trie as any).root;
      console.log(trie.inspect());
    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
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

      // Show all keys
      console.log(_.join(uniqKeys, "\n"));

      // // Print all groups as flat list
      // const groupList = _.join(
      //   _.map(groups, (g) => g.id), "\n"
      // );
      // console.log(groupList);

      // Print all groups as tree
      const trie = new Trie();
      _.each(groups, (g) => {

        const groupId: string = g.id;
        const parts = groupId.split("/");
        const subgroups = _.map(
          _.range(parts.length), (i) => _.join(parts.slice(0, i+1), "/")
        );
        // console.log('parts', subgroups);
        _.each(subgroups, sg => {
          // console.log('adding', sg);
          trie.add(sg);
        });
      });
      const root = (trie as any).root;
      console.log(trie.inspect());
      // console.log(prettyPrint(root));

      // for (const x of trie) {
      //   console.log(x);
      // }

      // console.log(trie.prefixes());
      // const roots = Array.from(trie.prefixes());
      // const rootStr = _.join(roots, "\n");
      // console.log(rootStr);
    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
}


export async function showGroupTree(runState: RunState): Promise<void> {
  configAxios(runState)
    .get("/groups")
    .then((r: any) => {
      const groups = r.data.groups;
      console.log("total #", groups.length);

      // Print all groups as tree
      const trie = new Trie<string>();

      _.each(groups, (g, i: number) => {
        if (6 < i && i < 8 ) {
          console.log(`group ${i} = ${prettyPrint(g)}`);
        }
        const groupId: string = g.id;
        const parts = groupId.split("/");
        const subgroups = _.map(
          _.range(parts.length), (i) => _.join(parts.slice(0, i+1), "/")
        );
        _.each(subgroups, sg => {
          trie.add(sg);
        });
      });

      // const root = (trie as any).root;
      const prefixes = trie.prefixes();

      let step = prefixes.next();
      while (!step.done) {
        const prefix = step.value;
        console.log(`> ${prefix}`);
        step = prefixes.next();
      }


      // console.log(`prefixes: ${prefixes}`);
      // _.each(prefixes, (prefix) => {
      //   console.log(`> ${prefix}`);
      //   // console.log(trie.inspect());
      // });
    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
}

export async function showInvitationTree(runState: RunState): Promise<void> {
  configAxios(runState)
    .get("/invitations")
    .then((r: any) => {
      const invites = r.data.invitations;
      console.log("total #", invites.length);

      _.each(invites, (invite, i: number) => {
        // if (6 < i && i < 8 ) {
        //   console.log(`group ${i} = ${prettyPrint(g)}`);
        // }
        const id: string = invite.id;
        const [groupId, inviteId] = id.split("/-/");
        console.log(`${groupId} --> ${inviteId}`)
      });

    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
}

export async function showNoteTree(runState: RunState): Promise<void> {
  configAxios(runState)
    .get("/notes")
    .then((r: any) => {
      const invites = r.data.notes;
      console.log("total #", invites);

      // _.each(invites, (invite, i: number) => {
      //   // if (6 < i && i < 8 ) {
      //   //   console.log(`group ${i} = ${prettyPrint(g)}`);
      //   // }
      //   const id: string = invite.id;
      //   const [groupId, inviteId] = id.split("/-/");
      //   console.log(`${groupId} --> ${inviteId}`)
      // });

    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
}

export async function showTagTree(runState: RunState): Promise<void> {
  configAxios(runState)
    .get("/tags")
    .then((r: any) => {
      const invites = r.data.tags;
      console.log("total #", invites);

      _.each(invites, (invite, i: number) => {
        // if (16 <= i && i < 38 ) {
          console.log(`tag ${i} = ${prettyPrint(invite)}`);
        // }
      });

    })
    .catch(err => {
      console.log("error: listGroups", err);
    });
}
