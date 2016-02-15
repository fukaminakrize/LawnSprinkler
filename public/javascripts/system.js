$(document).ready(function () {
	$('#systemCommandForm').submit(commandFormSubmit);
	$("#systemCommandConfirmModal_perform").click(performCommand);

	var systemCommandFormData;

	function commandFormSubmit(event) {
		event.preventDefault();

		systemCommandFormData = $('#systemCommandForm').serialize();

		$("#systemCommandConfirmModal_text").text("Really ?");
		$("#systemCommandConfirmModal").modal();
	}

	function performCommand() {
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

