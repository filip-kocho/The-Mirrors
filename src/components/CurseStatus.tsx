import type {State} from "../game/domain/engine";
import {CurseTokenIcon} from "./CurseTokenIcon";
import {statusOf} from "../game/systems/blackMirrorRuntime";
export function CurseStatus({s}:{s:State}){const p=s.players[s.active],status=statusOf(s,p.id);return status.fear.length?<div className="compact-curse-tokens" aria-label="Fear visit tokens"><span role="img" aria-label={status.fear.length+" Fear tokens"} title="Visit a different explored room to clear one Fear token"><CurseTokenIcon type="FEAR"/><b>{status.fear.length}</b></span></div>:null;}
