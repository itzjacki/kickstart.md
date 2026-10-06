import {log, multiselect, spinner, tasks} from '@clack/prompts'
import {execFileAsync} from "../tools.ts";
import type {PromiseWithChild} from "node:child_process";

interface MCP {
    name: string,
    url: string,
    scope: 'default' | 'workspace' | 'global'
}

const recommendedMCPs: MCP[] = [
    {
        name: 'atlassian',
        url: 'https://mcp.atlassian.com/v2/mcp',
        scope: "workspace",
    },
    {
        name: 'context7',
        url: 'https://mcp.context7.com/mcp',
        scope: "workspace"
    }
]

export const selectMCPs = async () => {
    const mcps = await multiselect({
        message: "Recommended MCPs",
        options: [
            {value: "atlassian", label: "Atlassian (Jira, Bitbucket, etc.)"},
            {value: "context7", label: "Context7. Up-to-date library documentation"}
        ],
    });

    if(typeof mcps === 'symbol') return

    await tasks([
        {
            title: 'Installing selected MCPs',
            task: async () => {
                const deferred:PromiseWithChild<{stdout:string, stderr:string}>[] =[]
                mcps.forEach(mcpName => {
                    const mcp = recommendedMCPs.find(r => r.name === mcpName)
                    if(!mcp) return

                    deferred.push(execFileAsync('kiro-cli',  ['mcp', 'add', '--name', mcp.name, '--url', mcp.url, '--scope', mcp.scope, '--force'], { encoding: "utf-8" }) )
                })
                const result = await Promise.allSettled(deferred)
                const error = result.filter(r => r.status === 'rejected')
                const success = result.filter(r => r.status === 'fulfilled').map(s => s.value.stderr.trim())
                // console.debug(result)
                error && error.length > 0  && log.error(`Error adding MCPs: ${error.map(e => e.reason)}`)
                log.info(success.join('\n'))
                // success.forEach(s => log.info(s))

                return 'MCPs has been installed'
            }
        }
    ])
}