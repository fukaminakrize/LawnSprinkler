$(document).ready(function () {
	//Remove port button pressed
	$(".portRemoveBtn").click(function () {
		var portItem = $(this).closest(".portItem");
		var portName = portItem.find(".portName p").text();
		bootbox.confirm("Remove port " + portName + "?", function(result) {
			if (result == false)
				return;

			removePortItem(portItem);
		});
	});

	//Edit port button pressed
	$(".portEditBtn").click(function () {
		//remove port from the list
		var portItem = $(this).closest(".portItem");
		var portId = portItem.attr("portId");

		//get port details
		$.get("/settings/port", { portId: portId }, function (res) {
			if (res.err) {
				alert(res.err);
			} else {
				var port = res.port;
				setupPortDetailForEditing(port);
				$("#portDetailModal").modal();	
			}
		});
	});

	$(".portAddBtn").click(function() {
		setupPortDetailForCreation();
		$("#portDetailModal").modal();
	});

	function setupPortDetailForCreation() {
		clearPortDetail();

		$("#portDetailModalForm_portId").val("");

		$("#portDetailModalConfirmBtn").text("Add");
	}

	function setupPortDetailForEditing(port) {		
		clearPortDetail();
		$("#portDetailModalForm_portId").val(port._id);

		$("#portDetailModalForm_name").val(port.name);

		//GPIO port used by this port, wont be listed in available GPIO ports, so insert it as selected option as a first option in select
		var option = "<option class=\"portGPIOPortListItem\" value=\"" + port.GPIOPortNum + "\" selected>" + port.GPIOPortNum + "</option>";
		$("#portDetailModalForm_GPIOPort").prepend(option);

		$("#portDetailModalForm_master").prop("checked", port.master);

		$("#portDetailModalConfirmBtn").text("Save");
	}

	function clearPortDetail(availableGPIOPorts) {
		$("#portDetailModalForm")[0].reset();

		$(".portGPIOPortListItem").remove();
		//get available GPIO ports and setup selection
		$.get("/settings/availableGPIOPorts", {}, function (res) {
			if (res.err) {
				alert(res.err);
			} else {
				var availableGPIOPorts = res.availableGPIOPorts;
				availableGPIOPorts.forEach(function(GPIOPort) {
					var option = "<option class=\"portGPIOPortListItem\" value=\"" + GPIOPort + "\">"+ GPIOPort + "</option>";
					$("#portDetailModalForm_GPIOPort").append(option);
				});
			}
		});
	}

	function removePortItem(portItem) {
		var portId = portItem.attr("portId");
		$.ajax({type: "DELETE", url: "/settings/port", data: {portId: portId}, success: function(result) {
			if (result.err) {
				alert(result.err);
			} else {
				portItem.slideUp(200);
			}
		}});
	}

	function setupAvailableGPIOPorts(availableGPIOPorts) {

	}

});

