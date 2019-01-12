﻿import './_.css';
import './_text.css';

import React, { Component } from 'react';
import Carets from './carets';
import Lines from './lines';
import LineNumbers from './line-numbers';
import { TextDocument } from '../../external/event-sourcing';
import SocketIO from 'socket.io-client';
import Logs from '../logging/logs';
import InputPanel from './input-panel';
import EventFactory from '../../services/event-factory';

class Document extends Component {
	constructor(props) {
		super(props);

		this._eventFactory = new EventFactory();

		this.state = {
			document: null,
			history: []
		}

		this.sendEvent = this.sendEvent.bind(this);
	}

	async componentDidMount() {
		const documentId = this.props.id;

		const serverUrl = `http://localhost:1337`;
		//const serverUrl = `http://api.text-sourcing.tomasz-rewak.com`;

		const response = await fetch(`${serverUrl}/document/${documentId}`);
		const currentState = await response.json();

		this._textDocument = new TextDocument(currentState);

		this.setState({ document: this._textDocument.state, history: this._textDocument.history });

		this._socket = SocketIO(`${serverUrl}?document=${documentId}`);
		this._socket.on('document change', event => {
			this.applyEvent(event);
		});

		//this.sendEvent(this._eventFactory.prepareAddCaretEvent({ line: 0, column: 0 }));
	}

	componentWillUnmount() {
		this._socket.disconnect()
	}

	sendEvent(event) {
		const potentialCommunicationDelay = 1000;
		const reducedEvent = {
			...event,
			timestamp: Date.now() + potentialCommunicationDelay
		}

		this.applyEvent(reducedEvent);
		this._socket.emit('document change', reducedEvent, timestamp => {
			if (!timestamp || !this._textDocument.updateTimestamp(reducedEvent, timestamp))
				this.reload();

			this.updateState();
		});
	}

	applyEvent(event) {
		this._textDocument.addEvent(event);

		this.updateState();
	}

	updateState() {
		if (this.state.history !== this._textDocument.history)
			this.setState({
				document: this._textDocument.state,
				history: this._textDocument.history
			});
	}

	reload() {
		console.log('=======================TODO=====================')
	}

	render() {
		if (!this.state.document)
			return <div className="loading-screen">Loading...</div>;

		return (
			<div className="document-scope">
				<div className="document-scroll">
					<div className="document" >
						<LineNumbers text={this.state.document.text} />
						<div className="document-content">
							<Carets text={this.state.document.text} carets={this.state.document.carets} />
							<Lines text={this.state.document.text} />
							<InputPanel text={this.state.document.text} carets={this.state.document.carets} onNewEvent={this.sendEvent} />
						</div>
					</div>
				</div>
				<Logs history={this.state.history} />
			</div>
		);
	}
}

export default Document;