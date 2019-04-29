//

import axios, {
  AxiosRequestConfig,
  AxiosInstance
} from "axios";

import { RunState } from "../cli/state";

export function configRequest(runState: RunState): AxiosRequestConfig {
  const auth = runState.credentials? {
    Authorization: `Bearer ${runState.credentials!.token}`
  } : {};

  const config: AxiosRequestConfig = {
    baseURL: "http://localhost:3000/",
    headers: {
      "User-Agent": "openreview-cli",
      ...auth
    },
    timeout: 10000,
    responseType: "json"
  };

  return config;
}

export function configAxios(runState: RunState): AxiosInstance {
  const conf = configRequest(runState);
  return axios.create(conf);
}
