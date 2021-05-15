/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

import anyTest, { TestInterface } from 'ava';
import { TransferrableMutationType } from '../../transfer/TransferrableMutation';
import { createTestingDocument } from '../DocumentCreation';
import { emitter, Emitter, expectMutations } from '../Emitter';
import { Window } from '../../worker-thread/window';
import { Document } from '../../worker-thread/dom/Document';
import { MutationFromWorker, PreventOrAllowNavigation } from '../../transfer/Messages';
import { TransferrableKeys } from '../../transfer/TransferrableKeys';

const test = anyTest as TestInterface<{
    document: Document;
    window: Window;
    emitter: Emitter;
}>;

test.beforeEach((t) => {
    const document = createTestingDocument();
    document.ownerDocument.addGlobalEventListener = () => true;

    const window = new Window(document);

    t.context = {
        document,
        window,
        emitter: emitter(document),
    };
});

test.serial.cb('window.onbeforeunload - transfer to main with prefer navigation flag', (t) => {
    const { document, window } = t.context;

    expectMutations(document, (mutations) => {
        t.deepEqual(mutations, [TransferrableMutationType.WINDOW_ON_BEFORE_UNLOAD, PreventOrAllowNavigation.PREVENT]);
        t.pass();
        t.end();
    });

    window.onbeforeunloadPreventNavigation = true;
    window.onbeforeunload = () => true;
});

test.serial.cb('window.onbeforeunload - transfer to main without prefer navigation flag', (t) => {
    const { document, window } = t.context;

    expectMutations(document, (mutations) => {
        t.deepEqual(mutations, [TransferrableMutationType.WINDOW_ON_BEFORE_UNLOAD, PreventOrAllowNavigation.ALLOW]);
        t.pass();
        t.end();
    });

    window.onbeforeunload = () => true;
});

test.serial.cb('window.onbeforeunload - setting prevent navigation without a onbeforeunload function set should not transfer to main', (t) => {
    const { document, window } = t.context;

    expectMutations(document, () => {
        t.fail();
        t.end();
    });

    window.onbeforeunloadPreventNavigation = true;

    Promise.resolve().then(() => {
        t.pass();
        t.end();
    });
});

test.serial.cb('window.onbeforeunload - setting prevent navigation when a onbeforeunload function is set should retransfer to main', (t) => {
    const { emitter, window } = t.context;
    const mutationsList: number[][] = [];

    function transmitted(strings: Array<string>, message: MutationFromWorker, buffers: Array<ArrayBuffer>) {
        mutationsList.push(Array.from(new Uint16Array(message[TransferrableKeys.mutations])));
        if (mutationsList.length === 3) {
            t.deepEqual(mutationsList, [
                [TransferrableMutationType.WINDOW_ON_BEFORE_UNLOAD, PreventOrAllowNavigation.ALLOW],
                [TransferrableMutationType.WINDOW_ON_BEFORE_UNLOAD, PreventOrAllowNavigation.PREVENT],
                [TransferrableMutationType.WINDOW_ON_BEFORE_UNLOAD, PreventOrAllowNavigation.ALLOW],
            ]);
            emitter.unsubscribe(transmitted);
            t.pass();
        }
    }

    Promise.resolve().then(() => {
        emitter.subscribe(transmitted);
        // First transfer
        window.onbeforeunload = () => true;
        // Second transfer
        window.onbeforeunloadPreventNavigation = true;
        // No transfer because onbeforeunloadPreventNavigation same value
        window.onbeforeunloadPreventNavigation = true;
        // Third transfer
        window.onbeforeunloadPreventNavigation = false;
        t.end();
    });
});
