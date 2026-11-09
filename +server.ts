import { json } from "@sveltejs/kit";
import { getCommit, getBranch, getRemote, getVersion } from "@imput/version-info";

export async function GET() {
    // Deployment builds may not include .git metadata (e.g. Coolify artifacts).
    let metadata = { commit: "souftube", branch: "main", remote: "contactsoufdev-arch/souftube-app", version: "11.7" };
    try {
        metadata = {
            commit: await getCommit(),
            branch: await getBranch(),
            remote: await getRemote(),
            version: await getVersion()
        };
    } catch {}
    return json({
        ...metadata
    });
}

export const prerender = true;
