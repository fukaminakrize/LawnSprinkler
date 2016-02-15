$(function() {
	$(".portSwitch").on("change", function() {
		$.ajax({type: "PUT", url: "/control/portState", data: {portId: this.id, state: this.checked}});
	});
});

