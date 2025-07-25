/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as SeedApi from "../../api/index";
import * as core from "../../core";

export const NestedUser: core.serialization.ObjectSchema<serializers.NestedUser.Raw, SeedApi.NestedUser> =
    core.serialization.object({
        name: core.serialization.string().optional(),
        user: core.serialization.lazyObject(() => serializers.User).optional(),
    });

export declare namespace NestedUser {
    export interface Raw {
        name?: string | null;
        user?: serializers.User.Raw | null;
    }
}
