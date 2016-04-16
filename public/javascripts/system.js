$(document).ready(function () {
	$('#systemCommandForm').submit(commandFormSubmit);
	$("#systemCommandConfirmModal_perform").click(performCommand);


	function commandFormSubmit(event) {

		event.preventDefault();


		var actionName = $("#systemCommandForm option:selected").text();
		console.log(actionName);
		bootbox.confirm(actionName + "?", function(result) {
			if (result == false)
				return;

			performCommand($('#systemCommandForm').serialize());
		});
	}

	function performCommand(systemCommandFormData) {
		commandForm = $('#systemCommandForm');
		$.ajax({
			url: commandForm.attr('action'),
			type: commandForm.attr('method'),
			data: systemCommandFormData,
			success: function(res) {
				if (res.err)
					console.log(res.err);
			}
		});
	}
});

