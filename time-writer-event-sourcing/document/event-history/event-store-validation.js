export default class EventStoreValidation {
	_countRevertEvents(chain) {
		return chain
			.filter(node => node.event && node.event.type === 'revert')
			.length;
	}

	_canAddRevertEvent(chain) {
		let revertEventsNumber = this._countRevertEvents(chain);
		return revertEventsNumber + 1 < chain.length / 2;
	}

	canAddEvent(chain, event) {
		let canAdd = true;

		if (event.type === 'revert')
			canAdd = canAdd && this._canAddRevertEvent(chain);

		return canAdd;
	}
}