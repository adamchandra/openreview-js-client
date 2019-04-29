
// import {
//   AxiosResponse,
//   AxiosError,
// } from 'axios';

// export const logResponse: ActionFunction<RunState, AxiosResponse> = (st: RunState, response: AxiosResponse) => {
//   console.log(response.status, response.statusText);
//   console.log(response.data);
//   // console.log(response.headers);
//   // console.log(response.config);
//   return st;
// };

// export const logError: ActionFunction<RunState, AxiosError> = (st: RunState, error: AxiosError) => {
//   if (error.response) {
//     console.log(error.response.data);
//     console.log(error.response.status);
//     console.log(error.response.headers);
//   } else {
//     console.log(error.message);
//   }
//   return st;
// };
