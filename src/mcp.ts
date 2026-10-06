import {multiselect} from '@clack/prompts'
import {execFileAsync} from "./tools.ts";

interface MCP {
    name: string,
    url: string,
    scope: 'default' | 'workspace' | 'global'
}

const recommendedMCPs: MCP[] = [
    {
        name: 'atlassian',
        url: 'https://mcp.atlassian.com/v2/mcp',
        scope: "workspace"
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

    mcps.forEach(mcpName => {
        const mcp = recommendedMCPs.find(r => r.name === mcpName)
        if(!mcp) return

        execFileAsync('kiro-cli',  ['mcp', 'add', '--name', mcp.name, '--url', mcp.url, '--scope', mcp.scope])
    })
}