import { BaseAction, Schema } from "../BaseAction"
import { ActionName } from "../types"
import { invoke } from "@/ntqqapi/ntcall"

interface Payload {
    method: string,
    params: any,
 }


export class InternalInvokeAPI extends BaseAction<Payload, any> {
    actionName = ActionName.NTQQAPI_INVOKE
    payloadSchema = Schema.object({
        method: Schema.string().required(),
        params: Schema.any().required()
    })

    protected async _handle(payload: Payload) {
        return await invoke(payload.method, payload.params) as Promise<any>
    }
}