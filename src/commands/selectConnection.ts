import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from "../common/global";
import { Constants } from "../common/constants";
import { ConnectionQuickPickItem } from "../common/IConnQuickPick";

'use strict';

export class selectConnectionCommand extends BaseCommand {
  async run() {
    // can we even select a connection it gets stored against a document uri

    let inEditor: boolean = true;

    if (!vscode.window || !vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document || !vscode.window.activeTextEditor.document.uri) {
      inEditor = false;
    }


    let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) connections = {};

    let hosts: ConnectionQuickPickItem[] = [];
    /*
    hosts.push({
      label: '$(plus) Create new connection',
      connection_key: '',
      is_new_selector: true
    });
    */

    for (const k in connections) {
      if (connections.hasOwnProperty(k)) {
        hosts.push({
          label: connections[k].label || connections[k].host,
          connection_key: k
        });
      }
    }

    const hostToSelect = await vscode.window.showQuickPick(hosts, { placeHolder: 'Odaberi konekciju', matchOnDetail: false });
    if (!hostToSelect) return;

    if (!inEditor) {
      Global.Configuration.update("defaultConnection", hostToSelect.label, vscode.ConfigurationTarget.Global)
        .then(() => {
          vscode.window.showInformationMessage(`Tekuća konekcija: ${hostToSelect.label}`);
          setTimeout(() =>
            vscode.commands.executeCommand('postgres.selectDatabase'),
            700);
        });
      return;
    }


    if (!hostToSelect.is_new_selector) {
      let connection: IConnection = Object.assign({}, connections[hostToSelect.connection_key]);
      if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
        connection.password = await Global.keytar.getPassword(Constants.ExtensionId, hostToSelect.connection_key);
      }
      EditorState.connection = connection;
      await vscode.commands.executeCommand('postgres.selectDatabase');
      return;
    }


    let result = await vscode.commands.executeCommand('postgres.addConnection');
    if (!result) return;
    await vscode.commands.executeCommand('postgres.selectDatabase');
  }
}