
import { NodeMessageInFlow, NodeMessage } from "node-red";
import simpleGit, { SimpleGit } from 'simple-git';
const fs = require('fs');

module.exports = function (RED: any) {

    function gitNode(config: any) {
        RED.nodes.createNode(this, config);
        let node = this;
        node.source = config.source
        node.destination = config.destination;
        try {

            node.msg = {};
            node.on('input', (msg, send, done) => {
                node.msg = RED.util.cloneMessage(msg);
                send = send || function () { node.send.apply(node, arguments) }

                processInput(node, msg, send, done, config.confignode);
            });

        }
        catch (err) {
            node.error('Error: ' + err.message);
            node.status({ fill: "red", shape: "ring", text: err.message })
        }
    }

    async function processInput(node, msg: NodeMessageInFlow, send: (msg: NodeMessage | NodeMessage[]) => void, done: (err?: Error) => void, config) {
        try {
            const git: SimpleGit = simpleGit();
            if(fs.existsSync('source')) fs.rmdirSync('source', { recursive: true });
            await git.clone(node.source, 'source')
            await git.cwd('source')
            await git.addRemote('secondary', node.destination)
            await git.push('secondary')
            if(fs.existsSync('source')) fs.rmdirSync('source', { recursive: true });
            send({
                payload: {
                    synced: true
                }
            })
            if (done) done()
        } catch (e) {
            send({
                payload: {
                    synced: false
                }
            })
            if (done) done(e)
        }
    }


    RED.nodes.registerType("gitsync", gitNode);
}