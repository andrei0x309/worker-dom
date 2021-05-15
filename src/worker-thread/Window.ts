/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS-IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview
 * WorkerDOM's `Window` class.
 */

import { transfer } from './MutationTransfer';
import { Document } from './dom/Document';
import { Event } from './Event';
import { TransferrableMutationType } from '../transfer/TransferrableMutation';
import { MessageToWorker, MessageType, PreventOrAllowNavigation } from '../transfer/Messages';
import { TransferrableKeys } from '../transfer/TransferrableKeys';

export class Window {
  private _document: Document;
  private _onBeforeUnload: Function;
  private _onBeforeUnloadPreventNavigation: boolean;

  constructor(document: Document) {
    this._document = document;
    this._onBeforeUnloadPreventNavigation = false;
  }

  _executeOnBeforeUnload = ({ data }: { data: MessageToWorker }) => {
    if (data[TransferrableKeys.type] === MessageType.EXEC_WINDOW_ON_BEFORE_UNLOAD) {
      this._onBeforeUnload(new Event('onbeforeunload', { bubbles: false, cancelable: false }));
    }
  };

  // Custom Flag to set if onbeforeunload should prevent navigation, default is false
  set onbeforeunloadPreventNavigation(flag: boolean) {
    this._onBeforeUnloadPreventNavigation = flag;
    // User called onbeforeunloadPreventNavigation after setting the onbeforeunload function
    if (typeof this._onBeforeUnload === 'function' && flag !== this._onBeforeUnloadPreventNavigation) {
      this._onBeforeUnloadPreventNavigation = flag;
      this.onbeforeunload(this._onBeforeUnload);
    }
  }

  // Setting to a function will enable the listner setting to anything else will remove the listner
  set onbeforeunload(fun: Function | any) {
    if (typeof fun === 'function') {
      this._document.ownerDocument.addGlobalEventListener('message', this._executeOnBeforeUnload);
      this._onBeforeUnload = fun;
      const preventNaigationFlag = this._onBeforeUnloadPreventNavigation ? PreventOrAllowNavigation.PREVENT : PreventOrAllowNavigation.ALLOW;
      transfer(this._document, [TransferrableMutationType.WINDOW_ON_BEFORE_UNLOAD, preventNaigationFlag]);
    } else {
      this._document.ownerDocument.removeGlobalEventListener('message', this._executeOnBeforeUnload);
    }
  }
}
