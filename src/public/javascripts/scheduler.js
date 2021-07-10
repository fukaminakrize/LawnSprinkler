$(document).ready(function () {
	//enable/disable job
	$(".jobEnableSwitch").on("change", function() {
		var jobId = $(this).closest("li").attr("jobId");
		$.ajax({type: "PUT", url: "/control/jobEnable", data: {jobId: jobId, enabled: this.checked}});
	});

	//edit job
	$(".jobEditBtn").click(function() {
		//
		var jobId = $(this).closest("li").attr("jobId");
		$.get("/control/job", { jobId: jobId }, function (res) {
			var job = res.job;
			setupJobDetailForEditing(job);
			$("#jobDetailModal").modal();
		});
	});

	//remove job from the list
	$(".jobRemoveBtn").click(function() {
		var jobItem = $(this).closest(".jobItem");
		var jobName = jobItem.find(".jobName").text();
		bootbox.confirm("Remove job " + jobName + "?", function(result) {
			if (result == false)
				return;

			removeJob(jobItem);
		});
	});

	//add job
	$(".jobAddBtn").click(function() {
		setupJobDetailForCreation();
		$("#jobDetailModal").modal();
	});


	$("#jobDetailModalForm").on("submit", function (e) {

	});


	$("#jobDetailModalAddPhaseBtn").click(function() {
		var jobId = $("#jobDetailModalForm_jobId").val();
		var phasePortId = $("#jobDetailModalForm_newPhasePort option:selected").prop("value");
		var phasePortName = $("#jobDetailModalForm_newPhasePort option:selected").text();
		var phaseDuration = $("#jobDetailModalForm_newPhaseDuration").val();

		var newPhase = {
			jobId: jobId,
			portId: phasePortId, 
			duration: phaseDuration
		};

		$.ajax({type: "POST", url: "/control/jobPhase", data: newPhase, success: function(result) {
			if (result.err) {
				alert(result.err)
			} else {
				newPhase = result.phase;
				newPhase.port = {name : phasePortName};
				$(getPhaseListItemHtml(newPhase)).hide().insertBefore("#newJobPhaseListItem").slideDown(200);
			}
		}});		
	});

	//remove phase
	$(document).on("click", ".jobDetailModalRemovePhaseBtn", function() {
	//the remove buttons are created dynamically so they have to be handled with on
		var jobId = $("#jobDetailModalForm_jobId").val();
		var phaseListItem =  $(this).closest(".jobPhaseListItem")
		var phaseId = phaseListItem.attr("phaseId");

		$.ajax({type: "DELETE", url: "/control/jobPhase", data: {jobId: jobId, phaseId: phaseId}, success: function(result) {
			if (result.err) {
				alert(result.err);	
			} else {
				phaseListItem.slideUp(200);
			}
		}});

	});

	//validate job form
	$("#jobDetailModalForm").validate({
		rules: {
			jobName: { required: true },
			jobStartTime: { required: true }
		}
	});


	function setupJobDetailForCreation() {
		clearJobDetail();

		$("#jobDetailModalForm_jobId").val("");

		$("#jobDetailModalConfirmBtn").text("Add");
	}

	function setupJobDetailForEditing(job) {
		clearJobDetail();

		$("#jobDetailModalForm_jobId").val(job._id);

		$("#jobDetailModalForm_name").val(job.name);
		$("#jobDetailModalForm_startTime").val(job.startTime);

		job.daysOfWeek.forEach(function (dayNumber) {
			$("#jobDetailModalForm input[name=jobRepeat_" + dayNumber + "]").prop("checked", true);
		});

		job.phases.forEach(function(phase) {
			$(getPhaseListItemHtml(phase)).insertBefore("#newJobPhaseListItem");
		});

		$("#jobDetailModalConfirmBtn").text("Save");
	}

	function clearJobDetail() {
		$("#jobDetailModalForm")[0].reset();
		$(".jobPhaseListItem").remove();
	}

	function getPhaseListItemHtml(phase) {
		var phaseId = phase._id;
		var portName = phase.port.name;
		var duration = phase.duration;

		return '' +
		'<li class="list-group-item jobPhaseListItem" phaseId="' + phaseId + '">' +
		'	<div class="container-fluid row">' +
		'		<div class="col-sm-9 col-xs-9">' + portName + ' for ' + duration + ((duration > 1) ? ' minutes' : ' minute') + '</div>' +
		'		<div class="col-sm-3 col-xs-3"><span class="pull-right"><button type="button" class="btn btn-sm btn-danger jobDetailModalRemovePhaseBtn">Remove <span class="glyphicon glyphicon-remove"></span></button></span></div>' +
		'	</div>' +
		'</li>';
	}

	function removeJob(jobItem) {
		var jobId = jobItem.attr("jobId");
		$.ajax({type: "DELETE", url: "/control/job", data: {jobId: jobId}, success: function(result) {
			if (result.err) {
				alert(result.err);
			} else {
				jobItem.slideUp(200);
			}
		}});
	}


	//setup the time picker
	$('.clockpicker').clockpicker({});

});

