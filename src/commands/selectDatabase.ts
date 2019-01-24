import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from "../common/global"

'use strict';

export class selectDatabaseCommand extends BaseCommand {
  async run() {
    // vscode.window.showInformationMessage('Select Database!');
    let connectionDetails: IConnection;
    let inEditor: boolean = true;
    if (!vscode.window || !vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document || !vscode.window.activeTextEditor.document.uri) {
      connectionDetails = await EditorState.getDefaultConnection();
      inEditor = false;
    } else {
      connectionDetails = EditorState.connection;
      if (!connectionDetails) return;
    }

    const connection = await Database.createConnection(connectionDetails, 'postgres');

    let databases: string[] = [];
    try {
      const res = await connection.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
      databases = res.rows.map<string>(database => database.datname);
    } finally {
      await connection.end();
    }

    //vscode.window.showInputBox
    const db = await vscode.window.showQuickPick(databases, { placeHolder: 'Odaberi bazu' });
    if (!db) return;
    if (!inEditor) {
      Global.Configuration.update("defaultDatabase", db, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Tekuća baza: ${db}`);

    } else {
      EditorState.connection = Database.getConnectionWithDB(connectionDetails, db);
    }

  }
}