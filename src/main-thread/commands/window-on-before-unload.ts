/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CommandExecutorInterface } from './interface';
import { TransferrableMutationType, WindowOnBeforeUnloadMutationIndex } from '../../transfer/TransferrableMutation';


export const WindowOnBeforeUnloadProcessor: CommandExecutorInterface = (strings, nodeContext, workerContext, objectContext, config) => {
  const allowedExecution = config.executorsAllowed.includes(TransferrableMutationType.WINDOW_ONBEFOREUNLOAD);

  return {
    execute(mutations: Uint16Array, startPosition: number, allowedMutation: boolean): number {
      if (allowedExecution && allowedMutation) {
        const funcStoreIndex = mutations[startPosition + WindowOnBeforeUnloadMutationIndex.Function];
        const parsedFunc = strings.hasIndex(funcStoreIndex) ? Function('return ' + strings.get(funcStoreIndex))() : undefined;

        if (parsedFunc) {
          window.onbeforeunload = parsedFunc;
        }

      }

      return startPosition + WindowOnBeforeUnloadMutationIndex.End;
    },
    print(mutations: Uint16Array, startPosition: number): {} {
      const funcStoreIndex = mutations[startPosition + WindowOnBeforeUnloadMutationIndex.Function];
      const parsedFunc = strings.hasIndex(funcStoreIndex) ? Function('return ' + strings.get(funcStoreIndex))() : "none";
      return {
        type: 'WINDOW_ONBEFOREUNLOAD',
        parsedFunc,
        allowedExecution,
      };
    },
  };
};
