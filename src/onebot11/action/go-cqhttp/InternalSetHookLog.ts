import { setLogHook } from "@/ntqqapi/hook"
import { BaseAction, Schema } from "../BaseAction"
import { ActionName } from "../types"

interface Payload {
    status: boolean,
 }


export class InternalSetHookLog extends BaseAction<Payload, boolean> {
    actionName = ActionName.NTQQAPI_HOOK_LOG
    payloadSchema = Schema.object({
        status: Schema.boolean().required()
    })

    protected async _handle(payload: Payload) {
        return setLogHook(payload.status)
    }
}
