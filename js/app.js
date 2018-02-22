var user_id = null;
var typingTimer = null;
var panelTimer = null;
var flavorlist = null;

$(document).on("change keyup", "textarea#new_key_input", function (event) {
	$("#new_key_title").val($(event.target).val().split(" ")[1]);
});

$(document).on("click", "button.btn-delete", function (event) {
	$.post(
			'check.php', {
				id: $(event.target).attr('id').split(" ")[1],
				action: "delete",
				type: $(event.target).attr('id').split(" ")[0],
				title: $(event.target).attr('id').split(" ")[2]
			})
		.done(function (data, status) {
			js_panel_generate($(event.target).attr('id').split(" ")[0]);
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});

$(document).on("change", "#vms_form_image_list, #vms_form_flavor_list", function (event) {
	switch ($(event.target).closest('form').attr('provider'))
	{
	case 'openstack': $.post(
			'check.php', {
				id: $("#vms_form_image_list").find(":selected").text(),
				action: "imagedetails",
				provider: $(event.target).closest('form').attr('provider'),
				type: $(event.target).attr('id').split("_")[0]
			})
		.done(function (data, status) {
			var arr = JSON.parse(data);
			var found = false;
			jQuery.each(flavorlist, function () {
				if ($(this)[0].Name == $("#vms_form_flavor_list").val() && ($(this)[0].Disk < arr.min_disk || $(this)[0].RAM < arr.min_ram)) {
					$("#vms_form_edit_modal_image_help").html('<strong>Warning!</strong> This image cannot be launched on selected flavor.');
					$("#vms_form_edit_modal_image_help").show();
					found = true;
					return;
				}
			});
			if (!found) $("#vms_form_edit_modal_image_help").hide();
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
	break;
	case 'vsphere': if ($("#vms_form_image_list").find(":selected")[0].text.includes("Windows")) { $("#vms_form_edit_modal_image_help").html('<strong>Warning!</strong> Windows images are big. It will take ~10 minutes to start an instance.'); $("#vms_form_edit_modal_image_help").show(); } else { $("#vms_form_edit_modal_image_help").hide(); }
	break;
	}
});

$(document).on("click", "#refreshnotifications", function (event) {
	show_notifications();
});

$(document).on("click", "#expandnotifications", function (event) {
	if ($("#expandnotifications").html() == "Show all alerts") $("#expandnotifications").html("Hide extra alerts");
	else $("#expandnotifications").html("Show all alerts");
});

$(document).on("click", "#expandvminfo", function (event) {
	if ($("#expandvminfo").html() == "Show advanced info <i class=\"fa fa-caret-down\" aria-hidden=\"true\"></i>") $("#expandvminfo").html("Hide advanced info <i class=\"fa fa-caret-up\" aria-hidden=\"true\"></i>");
	else $("#expandvminfo").html("Show advanced info <i class=\"fa fa-caret-down\" aria-hidden=\"true\"></i>");
});

$(document).on("click", "button.btn-switch", function (event) {
	$.post(
			'check.php', {
				id: $(event.target).attr('id').split(" ")[1],
				action: "switch",
				type: $(event.target).attr('id').split(" ")[0]
			})
		.done(function (data, status) {
			js_panel_generate($(event.target).attr('id').split(" ")[0]);
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});

$(document).on("click", "button.btn-domains-edit", function (event) {
	$.post('check.php', {
			id: $(event.target).attr('id').split(" ")[1],
			action: "get",
			type: $(event.target).attr('id').split(" ")[0]
		})
		.done(function (data, status) {
			var arr = JSON.parse(data);
			if (arr[0].shared == 1)
				var checkbx = true;
			else var checkbx = false;
			$("#" + $(event.target).attr('id').split(" ")[0] + "_edit_modal_input").val(arr[0].domain);
			$("#" + $(event.target).attr('id').split(" ")[0] + "_edit_modal_checkbox").prop('checked', checkbx);
			$("#" + $(event.target).attr('id').split(" ")[0] + "_edit_modal").attr("data-id", $(event.target).attr('id').split(" ")[1]);
			$('#domainsModal').attr("data-type", "edit");
			$('#domainsModal').modal('show');
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
	event.stopImmediatePropagation();
});


$(document).on("click", "button.btn-site-add", function (event) {

	$.post('check.php', {
			id: "shared",
			action: "list",
			type: "domains"
		})
		.done(function (data, status) {
			document.getElementById('site_edit_modal').reset();
			var arr = JSON.parse(data);
			$("#site_edit_modal_proxy").html("");
			jQuery.each(arr, function () {
				$("#site_edit_modal_proxy")
					.append($("<option></option>")
						.attr("value", $(this)[0].domain_id)
						.text($(this)[0].domain));

			});
			var date_max = new Date();
			$("#site_edit_modal_date").datetimepicker({
				format: 'YYYY-MM-DD',
				defaultDate: moment().add(1, 'days').format('YYYY-MM-DD'),
				minDate: moment().add(1, 'days').format('YYYY-MM-DD'),
				maxDate: date_max.setDate(date_max.getDate() + 180),
				showTodayButton: true,
				showClose: true,
				icons: {
					date: "fa fa-calendar"
				}
			});
			$("#site_edit_modal_date").val(moment().add(1, 'days').format('YYYY-MM-DD'));
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
	event.stopImmediatePropagation();
	$('#site_edit_modal').attr("data-type", "add");
	$('#siteModal').modal('show');

});

$(document).on("click", "button.btn-site-edit", function (event) {
	var selectedproxy = null;
	$.post('check.php', {
			id: $(event.target).attr('id').split(" ")[1],
			action: "get",
			type: $(event.target).attr('id').split(" ")[0]
		})
		.done(function (data, status) {
			var date_max = new Date();
			var arr = JSON.parse(data);
			$('#site_edit_modal').attr("data-id", arr[0].site_id);
			$('#site_edit_modal').attr("data-type", "edit");
			$("#site_edit_modal_name").val(arr[0].site_name);
			$("#site_edit_modal_host").val(arr[0].rhost);
			$("#site_edit_modal_port").val(arr[0].rport);
			selectedproxy = arr[0].domain_id;
			$("#site_edit_modal_date").datetimepicker({
				format: 'YYYY-MM-DD',
				minDate: moment().add(1, 'days').format('YYYY-MM-DD'),
				maxDate: date_max.setDate(date_max.getDate() + 180),
				showTodayButton: true,
				showClose: true,
				icons: {
					date: "fa fa-calendar"
				}
			});
			$("#site_edit_modal_date").val(arr[0].stop_date);
			$.post('check.php', {
					id: "shared",
					action: "list",
					type: "domains"
				},
				function (data, status) {
					var arr = JSON.parse(data);
					$("#site_edit_modal_proxy").html("");
					jQuery.each(arr, function () {
						$("#site_edit_modal_proxy")
							.append($("<option></option>")
								.attr("value", $(this)[0].domain_id)
								.text($(this)[0].domain));
					});
					$("#site_edit_modal_proxy").val(selectedproxy);
				});
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
	event.preventDefault();
	event.stopImmediatePropagation();
	$('#siteModal').find(':submit').removeClass("disabled");
	$('#siteModal').find(':submit').addClass("enabled");
	$('#siteModal').modal('show');
});

$(document).on("submit", "form.form_mod", function (event) {
	var error = false;
	$("[id^='" + $(event.target).attr('id') + "_']").each(function () {
		if (!form_change_handler($(this))) { error=true;}
	});
	if (error) {
		event.preventDefault();
		event.stopImmediatePropagation();
		return true;
	}
	var arr = {};
	$("[id^='" + $(event.target).attr('id') + "_']").each(function () {
		arr[$(this).attr('name')] = $(this).val();
	});
	$(".btn-vm-add").html('Instance Build <i class="fa fa-spinner fa-spin" style="font-size:14px"></i>');
	$(".btn-vm-add").addClass("disabled");
	$.post('check.php', {
			id: $(event.target).attr('data-id'),
			name: arr,
			action: $(event.target).attr("data-type"),
			type: $(event.target).attr('id').split("_")[0],
			publish: $("#" + $(event.target).attr('id').split("_")[0] + "_edit_modal_checkbox").prop('checked'),
			provider: $(event.target).attr("provider")
		})
		.done(function (data, status) {
			$(".btn-vm-add").removeClass("disabled");
			$(".btn-vm-add").html('Launch Instance');
			js_panel_generate((($(event.target).attr("provider")!=undefined)?$(event.target).attr("provider"):'')+$(event.target).attr('id').split("_")[0], function () {
				if (data.indexOf(' ') >= 0) {
					$("#infos").html('<div class="alert alert-danger alert-dismissable">' +
						'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
						'<strong>Error!</strong> ' + data +
						'</div>');
				} else {
					if ($(event.target).attr('id').split("_")[0] == "vms") switch ($(event.target).attr("provider"))
					{
						case 'openstack':
							$("#infos").html('<div class="alert alert-info alert-dismissable">' +
							'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
							'<strong>Success!</strong> Please, connect to your instances using ssh keys you specified.' +
							'</div>');
							break;
						case "vsphere":
							$("#infos").html('<div class="alert alert-info alert-dismissable">' +
							'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
							'<strong>Success!</strong> Your VM is being instantiated. You will receive email about the result of operation when it will be done.' +
							'</div>');
							break;
					}

					else if ($(event.target).attr('id').split("_")[0] == "keys") $("#infos").html('<div class="alert alert-info alert-dismissable">' +
						'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
						'<strong>Success!</strong> Now you can launch a virtual machine with this key.' +
						'</div>');
				}
			});
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
	event.preventDefault();
	event.stopImmediatePropagation();
	$('#' + ($(event.target).attr('id').split("_")[0] + 'Modal')).modal('hide');
	document.getElementById($(event.target).attr('id')).reset();
});

$(document).on("keyup change", "form.form_error", function (event) {
	clearTimeout(typingTimer);
	target = $(event.target);
	typingTimer = setTimeout("form_change_handler(target);", 1000);
});
$(document).on("click", "[data-action-vm]", function (event) {
	$('#page-wrapper > div > button').addClass('disabled');
	$('[data-status-id=' + $(event.target).closest('ul').attr('id') + ']').html('<i class="fa fa-spinner fa-spin" style="font-size:24px"></i>');
	$(event.target).closest('tr').children('td').each(function () {
		$(this).find('button').addClass('disabled');
	});
	$.post(
			'check.php', {
				id: $(event.target).closest('ul').attr('id'),
				action: $(event.target).attr('data-action-vm'),
				provider: $(event.target).closest('ul').attr('data-provider-vm'),
				type: "vm"
			})
		.done(function (data, status) {
			clearTimeout(panelTimer);
			panelTimer = setTimeout(function () {
				js_panel_generate($(event.target).closest('ul').attr('data-provider-vm')+"vms");
				$('#page-wrapper > div > button').removeClass('disabled');
			}, 10000);

		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});
$(document).on("click", "[data-action-vm-extend]", function (event) {
	$('#page-wrapper > div > button').addClass('disabled');
	$('[data-status-id=' + $(event.target).closest('ul').attr('vm_id') + ']').html('<i class="fa fa-spinner fa-spin" style="font-size:24px"></i>');
	$(event.target).closest("div").children("button").addClass("disabled");
	$.post(
			'check.php', {
				id: $(event.target).closest('ul').attr('vm_id'),
				action: "extend",
				days: $(event.target).attr('data-action-vm-extend'),
				provider: $(event.target).closest('ul').attr('data-provider-vm'),
				type: "vm"
			})
		.done(function (data, status) {
			clearTimeout(panelTimer);
			panelTimer = setTimeout(function () {
				js_panel_generate($(event.target).closest('ul').attr('data-provider-vm')+"vms");
				$('#page-wrapper > div > button').removeClass('disabled');
			}, 3000);

		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});
$(document).on("click", "[data-action-vm-delete]", function (event) {
	modal = '<div class="modal fade" id="temp_modal" role="dialog">' +
		'<div class="modal-dialog modal-sm">' +
		'<div class="modal-content">' +
		'<div class="modal-header">' +
		'<button type="button" class="close" data-dismiss="modal">&times;</button>' +
		'<h4 class="modal-title">Are you sure?</h4>' +
		'</div>' +
		'<div class="modal-body">' +
		'<p>This action will remove VM forever.</p>' +
		'</div>' +
		'<div class="modal-footer">' +
		'<div class="col-sm-6">' +
		'<ul id="' + $(event.target).closest('ul').attr('id') + '" data-provider-vm="' + $(event.target).closest('ul').attr('data-provider-vm') + '">' +
		'<button type="button" class="btn btn-danger" data-action-vm="terminatevm" data-dismiss="modal">Terminate</button>' +
		'</ul>' +
		'</div>' +
		'<div class="col-sm-6">' +
		'<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
		'</div></div></div></div></div>'
	$('#temp_modals').html(modal);
	$('#temp_modal').modal();

});

$(document).on("click", "[data-action-vminfo]", function (event) {
	$.post(
			'check.php', {
				id: $(event.target).closest('ul').attr('id'),
				action: $(event.target).attr('data-action-vminfo'),
				provider: $(event.target).closest('ul').attr('data-provider-vm'),
				type: "vm"
			})
		.done(function (data, status) {
			var vm = JSON.parse(data);
			var body = '<div class="container><div class="container row"><strong>Name</strong>: ' + vm.name + '</div>';
			if (typeof vm.key_name!==typeof undefined) body += '<div class="container row"><strong>SSH Key</strong>: ' + vm.key_name.split("_")[0] + '</div>';
			if (typeof vm.addresses!==typeof undefined) switch ($(event.target).closest('ul').attr('data-provider-vm'))
			{
				case "openstack" : body += '<div class="container row"><strong>IP (internal, [external])</strong>: ' + vm.addresses.split("=")[1] + '</div>'; break;
				case "vsphere" : body += '<div class="container row"><strong>IP</strong>: ' + vm.addresses + '</div>'; break;
			}
			else body += '<div class="container row"><strong>IP (internal, external)</strong>: Unknown or not assigned</div>';
			body += '<div class="container row"><strong>Image</strong>: ' + vm.image.split("(")[0] + '</div>';
			if (typeof vm.flavor!==typeof undefined)
			{
				$.post(
					'check.php', {
						id: vm.flavor.split(' ')[0],
						action: "flavordetails",
						provider: $(event.target).closest('ul').attr('data-provider-vm'),
						type: "vm"
				})
				.done(function (data, status) {
					var flavor = JSON.parse(data);
					body += '<div class="container row"><strong>Flavor</strong>: ' + vm.flavor.split(' ')[0] + '</div>';
					body += '<div class="container row"><strong>VCPUs</strong>: ' + flavor.vcpus + '</div>';
					body += '<div class="container row"><strong>RAM</strong>: ' + flavor.ram + '</div>';
					body += '<div class="container row"><strong>Disk</strong>: ' + flavor.disk + '</div></div>';
					body += '<a href="#VMinfoadvanced" data-toggle="collapse" id="expandvminfo" class="btn btn-default btn-block">Show advanced info <i class="fa fa-caret-down" aria-hidden="true"></i></a>' +
						'<div class="container collapse panel-collapse" id="VMinfoadvanced">';
					jQuery.each(vm, function (key, value) {
						body += '<div class="container row">' + key + ':' + value + '</div>';
					});
					body += '</div>';
					$('#VMinfomodalbody').html(body);
					$('#VMinfomodal').modal('show');
				})
				.fail(function () {
					window.location.replace("/index.php");
				});
			}
			else
			{
					body += '<div class="container row"><strong>VCPUs</strong>: ' + vm.vcpus + ' cores</div>';
					body += '<div class="container row"><strong>RAM</strong>: ' + vm.ram + ' MB</div>';
					body += '<div class="container row"><strong>Disk</strong>: ' + Math.round(vm.disk*100)/100 + ' GB</div></div>';
					$('#VMinfomodalbody').html(body);
					$('#VMinfomodal').modal('show');
			}
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});

$(document).on("click", "[data-action-vnc]", function (event) {
	$.post(
			'check.php', {
				id: $(event.target).closest('ul').attr('id'),
				action: $(event.target).attr('data-action-vnc'),
				provider: $(event.target).closest('ul').attr('data-provider-vm'),
				type: "vm"
			})
		.done(function (data, status) {
			var vm = JSON.parse(data);
			var URL=vm.url;
			switch ($(event.target).closest('ul').attr('data-provider-vm'))
			{
				case "vsphere":
					delete vm["url"];
					var urltopass = 'wss://'+vm.host+':'+vm.port+'/ticket/'+vm.ticket;
					window.open(URL+='?url='+encodeURIComponent(urltopass), '_blank');
					break;
				case "openstack":
					window.open(URL,'_blank');
					break;
			}
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});

$(document).on("click", "button.assignip", function (event) {
	$(event.target).addClass("disabled");
	$.post(
			'check.php', {
				id: $(event.target).attr('id'),
				action: "assignip",
				provider: $(event.target).attr('data-provider-vm'),
				type: "vm"
			})
		.done(function (data, status) {
			clearTimeout(panelTimer);
			panelTimer = setTimeout(function () {
				js_panel_generate("openstackvms");
			}, 2000);
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
});

function form_change_handler(event) {
	if (id == "site_edit_modal_name") check_form_name_db(event);
	if (id == "site_edit_modal_host") check_form_blacklist_db(event);
	var id = event.attr('id');
	var attr = event.attr('data-validator-name');
	if (typeof attr !== typeof undefined && attr !== false) {		
		var patt = new RegExp(attr);
		if (!(patt.test(event.val()))) {
			$("#site_edit_modal_name_help").html("Wrong input type! Make sure you input correct site name.");
			$("#site_edit_modal_host_help").html("Wrong host! Make sure you have a dot and at least one letter before and two after it.");
			event.attr("data-comment", "error");
			event.parent().closest('div').addClass("has-error");
			//event.closest("form").find(':submit').addClass("disabled");
			$('#' + event.attr('id') + '_help').show();
			return false;
		} else {
			event.attr("data-comment", "");
			event.parent().closest('div').removeClass("has-error");
			$('#' + event.attr('id') + '_help').hide();
			return true;
		}
	}
	return true;
}

$(document).on("submit", "form.form_add", function (event) {
	$.post('check.php', {
			id: $("#" + $(event.target).attr('id').split("_")[0] + "_add_checkbox").prop('checked'),
			name: $("#" + $(event.target).attr('id').split("_")[0] + "_add_input").val(),
			action: "add",
			type: $(event.target).attr('id').split("_")[0]
		})
		.done(function (data, status) {
			js_panel_generate($(event.target).attr('provider')+$(event.target).attr('id').split("_")[0], function () {
				if (data == "false") {
					$("#" + $(event.target).attr('id') + "_return").removeClass("hide");
				}
			});
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
	event.preventDefault();
	event.stopImmediatePropagation();
	document.getElementById($(event.target).attr('id')).reset();
});
$(document).on("click", ".btn-vm-add", function (event) {
	modal = '<div class="modal fade" id="vmsModal" tabindex="-1" role="dialog" aria-labelledby="VMModal" aria-hidden="true">' +
		'<div class="modal-dialog">' +
		'<div class="modal-content">' +
		'<form role="form" novalidate class="form_mod form_error" data-type="createserver" provider="' + $(event.target).attr('data-provider') + '" id="vms_form">' +
		'<div class="modal-header">' +
		'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
		'<h3 class="modal-title" id="myModalLabel">Launch Instance</h3>' +
		'</div>' +
		'<div class="modal-body">' +
		'<div class="row">' +
		'<div class="col-sm-12"><h4>VM Name:</h4></div>' +
		'<div class="col-sm-12"><input type="text" required class="form-control form-name-check" name="name" id="vms_form_edit_modal_name" data-validator-name="^([A-Za-z0-9])([A-Za-z0-9-])+$" disabled></div>' +
		'</div>' +
		'<div class="container"><span style="color:red; display:none" id="vms_form_edit_modal_name_help" class="help-inline">Wrong input type! Make sure you input correct VM name.<br> Name can contain only letters, numbers and dashes (dash can\'t be the first symbol).</span></div>' +
		'<div class="row">' +
		'<div class="col-sm-12"><h4>Images:</h4></div>' +
		'<div class="col-sm-12">' +
		'<select class="form-control" required name="image" id="vms_form_image_list" disabled>' +
		'</select>' +
		'</div>' +
		'</div>' +
		'<div style="display:none" id="vms_form_edit_modal_image_help" class="alert alert-warning">' +
		'<strong>Warning!</strong> This image cannot be launched on selected flavor.' +
		'</div>' +
		'<div class="row" id="vms_form_flavor_div">' +
		'<div class="col-sm-12"><h4>Flavor:</h4></div>' +
		'<div class="col-sm-12">' +
		'<select class="form-control" required name="flavor" id="vms_form_flavor_list" disabled>' +
		'</select>' +
		'</div>' +
		'</div>' +
		'<div class="row" id="vms_form_keypair_div">' +
		'<div class="col-sm-12"><h4 class="key_info">Key pair:</h4></div>' +
		'<div class="col-sm-12">' +
		'<select class="form-control" name="keypair" required id="vms_form_keypair_list" disabled>' +
		'</select>' +
		'</div>' +
		'</div>' +
		'<h4>Expiration date:</h4>' +
		'<div class="form-group input-group col-sm-12" data-provide="datepicker">' +
		'<input type="text" required class="datepicker form-control" name="date" id="vms_form_edit_modal_date" data-validator-name="^\\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$" disabled>' +
		'<span class="input-group-addon">' +
		'<span class="glyphicon glyphicon-calendar"></span>' +
		'</span>' +
		'</div>' +
		'<div class="row"><span style="color:red; display:none" id="vms_edit_modal_date_help" class="help-inline">Wrong date format</span></div>' +
		'</div>' +
		'<div class="modal-footer form-row">' +
		'<div class="col-sm-12 container" style="padding: 0px 0px 10px 0px">' +
		'<button type="submit" class="form-control btn btn-primary">Launch</button>' +
		'</div>' +
		'<div class="col-sm-12 container" style="padding: 0px">' +
		'<button class="form-control btn btn-danger" data-dismiss="modal">Close</button>' +
		'</div>' +
		'</div>' +
		'</form>' +
		'</div>' +
		'</div>' +
		'</div>';
	$('#temp_modals').html(modal);
	get_flavor();
	get_images();
	switch ($(event.target).attr('data-provider'))
	{
		case "openstack":
				if (get_keys()) {
					$('.modal-body').html('<h3><i class="fa fa-exclamation-triangle" aria-hidden="true" style="color: red"></i> Please add public key <a href="/user/index.php?dashboard=Profile">here</a></h3>');
					$('#vms_form > div.modal-footer.form-row > div:nth-child(1) > button').hide();
				}
				break;
		default: $('#vms_form_keypair_div').hide();
				 $("[id^='vms_form_']").each(function () {
				 	$(this).prop("disabled", "")
				 });
	}

	$('#vmsModal').modal('show');
	var date_vm = new Date();
	$("#vms_form_edit_modal_date").datetimepicker({
		format: 'YYYY-MM-DD',
		defaultDate: moment().add(1, 'days').format('YYYY-MM-DD'),
		minDate: moment().add(1, 'days').format('YYYY-MM-DD'),
		maxDate: date_vm.setDate(date_vm.getDate() + 180),
		showTodayButton: true,
		showClose: true,
		icons: {
			date: "fa fa-calendar"
		}
	});

});
$(document).ready(function () {
	$('#sites').DataTable();
	count_sites();
	count_vms();
});

function js_panel_generate(tumbler, returndata = null) {
	if (!returndata) returndata = function () {};
	if (!isNaN(returndata) && returndata) {
		user_id = returndata;
		returndata = null;
		returndata = function () {}
	}
	switch (tumbler) {
		case "blacklist":
			js_panel_generate_blacklist(returndata);
			break;
		case "domains":
			js_panel_generate_domains(returndata);
			break;
		case "users":
			js_panel_generate_users();
			break;
		case "site":
			js_panel_generate_site(returndata);
			break;
		case "keys":
			js_panel_generate_sshkeys(returndata);
			break;
		case "openstackvms":
			js_panel_generate_vms(returndata, "openstack");
			break;
		case "vspherevms":
			js_panel_generate_vms(returndata, "vsphere");
			break;
	}
}

function js_panel_generate_sshkeys(returndata) {

	var retbody = $.post('check.php', {
			id: user_id,
			name: "none",
			action: "list",
			type: "keys"
		})
		.done(function (data, status) {
			var arr = JSON.parse(data);
			var body =
				'<div class="row prepend-top-default">' +
				'<div class="col-lg-6">' +
				'<h4 class="prepend-top-0">SSH Keys</h4>' +
				'<p>SSH keys allow you to establish a secure connection between your VM\'s and Selfportal.</p>' +
				'<p class="profile-settings-content">Before you can add an SSH key you need to generate it.</p>' +
				'<div>' +
				'<form class="js-requires-input form_mod" data-type="add" id="keys_form" accept-charset="UTF-8">' +
				'<div class="form-group">' +
				'<label class="label-light" for="keys_form_key">Key</label>' +
				'<textarea class="form-control" rows="8" required="required"  pattern="^ssh-[rd]sa" placeholder="Don\'t paste the private part of the SSH key. Paste the public part, which is usually contained in the file \'~/.ssh/id_rsa.pub\' and begins with \'ssh-rsa\'." name="key"  id="keys_form_key"></textarea>' +
				'</div>' +
				'<div class="form-group">' +
				'<label class="label-light" for="keys_form_title">Title</label><small> Can contain only numbers, letters and dashes (dash can\'t be a first symbol)</small>' +
				'<input class="form-control" required="required" type="text" name="title" id="keys_form_title" pattern="^([A-Za-z0-9])([A-Za-z0-9-])+$" maxlength="30">' +
				'</div>' +
				'<div class="prepend-top-default">' +
				'<input type="submit" name="commit" value="Add key" class="btn btn-create btn-success">' +
				'</div></form></div>' +
				'<hr>' +
				'<h5>Your SSH keys</h5>' +
				'<div class="append-bottom-default">' +
				'<div class="container col-lg-6 list-group">';
			jQuery.each(arr, function () {
				body +=
					'<div class="list-group-item">' +
					'<i class="fa fa-key hidden-xs"></i>' +
					'<a class="title" href="#">' + $(this)[0].title + '</a>' +
					'<span class="pull-right">' +
					'<button style="padding:0;" class="btn btn-transparent btn-link btn-delete"  id="keys ' + $(this)[0].key_id + '" href="#">' +
					'<i class="fa fa-trash" id="keys ' + $(this)[0].key_id + ' ' + $(this)[0].title + '"></i>' +
					'</button></span>' +
					'</div>';
			});
			body += '</div></div></div></div>';
			$('#publickey').html(body);
			returndata();
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function js_panel_generate_vms(returndata, provider) {
	$('#side-menu > li:nth-child(3) > ul').addClass('in');
	$(document).ready(function () {
		$('#temp_modals').html('<div class="modal fade" id="temp_modal" role="dialog"><i class="fa fa-spinner fa-spin center fa-white spinner-on"></i></div>');
		$('#temp_modal').modal('show');
	});

	var retbody = $.post('check.php', {
			panel: $('#' + provider + '_vm_div').attr('panel'),
			action: "list",
			provider: provider,
			type: "vm"
		})
		.done(function (data, status) {
			if (!data) {
				$('#temp_modal').modal('hide');
				$('#' + provider + '_vm_div').html("<hr><h2 align=\"center\">Unfortunately, no data available here.</h2><hr>");
				returndata();
				return;
			}
			var body =
				'<p><table id="vm_list_'+provider+'" class="display" cellspacing="0" width="100%">' +
				'<thead><tr>' +
				'<th>VM Name</th>' +
				'<th>Image Name</th>' +
				'<th>IP Address</th>' +
				'<th>Status</th>' +
				'<th>Shutdown Date</th>' +
				'<th>Action</th>';
			if ($('#' + provider + '_vm_div').attr('panel') == "admin") body += '<th>Owner</th>';
			body += '</tr></thead>' +
				'<tfoot><tr>' +
				'<th>VM Name</th>' +
				'<th>Image Name</th>' +
				'<th>IP Address</th>' +
				'<th>Status</th>' +
				'<th>Shutdown Date</th>' +
				'<th>Action</th>';
			if ($('#' + provider + '_vm_div').attr('panel') == "admin") body += '<th>Owner</th>';
			body += '</tr></tfoot>' +
				'<tbody>';
			var arr = JSON.parse(data);
			$('#' + provider + '_vm_div').html("");
			if (arr.length > 0) {
				jQuery.each(arr, function () {
					body +=
						'<tr><td>' +
						$(this)[0]["Name"].split("_")[0] +
						'</td><td>' +
						($(this)[0]["Image Name"]=="Deploying"?'<span class="label label-default">DEPLOYING IMAGE</span>':$(this)[0]["Image Name"]==null?'<span class="label label-default">UNKNOWN</span>':$(this)[0]["Image Name"]) +
						'</td><td>';
					if ($(this)[0]["Networks"] != null) {
						if (typeof $(this)[0]["Networks"].split(",")[1] !== typeof undefined)
							body += $(this)[0]["Networks"].split(",")[$(this)[0]["Networks"].split(",").length-1];
						else if ($(this)[0]["Status"] == "ACTIVE") body += "<button data-provider-vm=\"" + provider + "\" class=\"btn btn-primary btn-xs assignip\" id=\"" + $(this)[0]["ID"] + "\">Assign floating IP</button> ";
						else if ($(this)[0]["Status"] == "poweredOn") body += $(this)[0]["Networks"];
						else body += "No floating IP assigned";
					} else body += '<span class="label label-default">UNKNOWN</span>';
					body += '</td><td><div data-status-id="' + $(this)[0]["ID"] + '">';
					switch ($(this)[0]["Status"]) {
						case "ACTIVE":
						case "poweredOn":
							body += '<span class="label label-success">ACTIVE';
							break;
						case "SHUTOFF":
						case "poweredOff":
							body += '<span class="label label-warning">SHUTOFF';
							break;
						case "Building":
							body += '<span class="label label-default">BUILDING';
							break;
						case "TERMINATED":
							body += '<span class="label label-danger">TERMINATED';
							break;
						case "MIGRATING":
						case "RESIZING":
							body += '<span class="label label-warning">MAINTENANCE';
							break;
						default:
							body += '<span class="label label-danger">FAILURE';
					};
					body +='</span></div></div></td><td><div class="dropdown">';
					var extendlimit = new Date();
					var dateVM = new Date($(this)[0]["date"]);
					extendlimit.setDate(extendlimit.getDate() + parseInt($(this)[0]['extendlimit']));
					if (typeof $(this)[0]["date"] !== typeof undefined) {
						body += $(this)[0]["date"];
						if (dateVM < extendlimit) {
							body += '<button class="btn btn-primary btn-xs dropdown-toggle" type="button" data-toggle="dropdown">+' +
								'</button>' +
								'<ul class="dropdown-menu vm-actions" data-provider-vm="' + provider + '" vm_id="' + $(this)[0]["ID"] + '">' +
								'<li><a href="#" data-action-vm-extend="1">+1 day</a></li>' +
								'<li><a href="#" data-action-vm-extend="5" >+5 days</a></li>' +
								'<li><a href="#" data-action-vm-extend="10">+10 days</a></li>' +
								'</ul> ';
						}
					}
					if ($(this)[0]["Status"]=="TERMINATED" || $(this)[0]["Status"]=="FAILURE") {
						body += '</div></td><td>' +
						'<div class="dropdown">' +
						'<button class="btn btn-primary btn-sm dropdown-toggle" type="button" data-toggle="dropdown">Actions' +
						'<span class="caret"></span></button>' +
						'<ul class="dropdown-menu vm-actions" data-provider-vm="' + provider + '" id="' + $(this)[0]["ID"] + '">' +
						'<li><a href="#" data-action-vm="clearvm">Remove</a></li>' +
						'</ul> </div>' +
						'</td>';
					}
					else if ($(this)[0]["Status"]=="MIGRATING" || $(this)[0]["Status"]=="RESIZING") {
						body += '</div></td><td>' +
						'<div class="dropdown">' +
						'<button class="btn btn-primary btn-sm dropdown-toggle" type="button" data-toggle="dropdown">Actions' +
						'<span class="caret"></span></button>' +
						'<ul class="dropdown-menu vm-actions" data-provider-vm="' + provider + '" id="' + $(this)[0]["ID"] + '">' +
						'<li><a href="#" data-action-vminfo="info">Info</a></li>'+
						'</ul></div>' +
						'</td>';
					}
					else {
						body += '</div></td><td>' +
						'<div class="dropdown">' +
						'<button class="btn btn-primary btn-sm dropdown-toggle '+($(this)[0]["Status"]=="Building"?"disabled":"")+'" type="button" data-toggle="dropdown">Actions' +
						'<span class="caret"></span></button>' +
						'<ul class="dropdown-menu vm-actions '+($(this)[0]["Status"]=="Building"?"disabled":"")+'" data-provider-vm="' + provider + '" id="' + $(this)[0]["ID"] + '">' +
						'<li><a href="#" data-action-vminfo="info">Info</a></li>' +
						'<li><a href="#" data-action-vnc="vnc">Open console</a></li>' +
						'<li><a href="#" data-action-vm="startvm" >Start</a></li>' +
						'<li><a href="#" data-action-vm="stopvm">Stop</a></li>' +
						'<li><a href="#" data-action-vm="rebootvm">Reboot</a></li>' +
						'<li><a href="#" data-action-vm-delete="terminatevm">Terminate</a></li>' +
						'</ul> </div>' +
						'</td>';	
					}
					if ($('#' + provider + '_vm_div').attr('panel') == "admin") body += '<td>' + $(this)[0]["owner"] + '</td>';
					body += '</tr>';
				});
				body += '</tbody></table></p>';
				$('#' + provider + '_vm_div').html(body);
				$('#vm_list_'+provider).DataTable();
			}
			$('#temp_modal').modal('hide');
			returndata();
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function js_panel_generate_users(returndata) {
	var retbody = $.post('check.php', {
			id: "none",
			name: "none",
			action: "list",
			type: "users"
		})
		.done(function (data, status) {
			var body =
				'<p><table class="table table-striped table-bordered table-hover">' +
				'<thead><tr>' +
				'<th>ID</th>' +
				'<th>Username</th>' +
				'<th>Email</th>' +
				'<th>Department</th>' +
				'</tr></thead><tbody>';
			var arr = JSON.parse(data);
			jQuery.each(arr, function () {
				body +=
					'<tr><td>' +
					$(this)[0].user_id +
					'</td><td>' +
					$(this)[0].username +
					'</td><td>' +
					$(this)[0].email +
					'</td><td>' +
					$(this)[0].department +
					'</td></tr>';
			});
			body += '</tbody></table></p>'
			$('#users').html(body);
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function js_panel_generate_domains(returndata) {

	var retbody = $.post('check.php', {
			id: "none",
			name: "none",
			action: "list",
			type: "domains"
		})
		.done(
			function (data, status) {
				var body = '<p><div class="hide alert alert-danger" id="domains_add_form_return">' +
					'<strong>Alert!</strong> Domain were not added. This name already exists in the global list.' +
					'</div></p>' +
					'<form class="form-inline form_add form_error" id="domains_add_form" style="padding:10px 0px 10px">' +
					'<div class="form-group">' +
					'<input type="text" required class="form-control" id="domains_add_input" data-validator-name="(?:[a-z][a-z0-9_.]*)(\\.)(?:[a-z][a-z0-9_]{1,})" minlength="4"  placeholder="Domain to be published..." >' +
					'</div>' +
					'<label for="domains_add_checkbox" class="form-check-label" >' +
					'<input class="form-check-input" type="checkbox" id="domains_add_checkbox"> Publish' +
					'</label>' +
					'<button type="submit" class="btn btn-primary">Add</button>' +
					'<div class="container"><span style="color:red; display:none" id="domains_add_input_help" class="help-inline">Wrong input type! Make sure you have a dot and at least one letter before and two after it.</span></div>' +
					'</form>' +
					'<table class="table table-striped table-bordered table-hover">' +
					'<thead><tr>' +
					'<th>Domain name</th>' +
					'<th>Shared</th>' +
					'<th>Actions</th>' +
					'</tr></thead><tbody>';
				var arr = JSON.parse(data);
				jQuery.each(arr, function () {
					body +=
						'<tr><td>' +
						$(this)[0].domain +
						'</td><td>' +
						$(this)[0].shared +
						'</td><td>' +
						'<button type="button" data-toggle="modal" data-target="#DomainsModal" id="domains ' + $(this)[0].domain_id + '" class="btn btn-primary btn-domains-edit">Edit</button>' +
						'<button type="button" id="domains ' + $(this)[0].domain_id + '" class="btn btn-danger btn-delete">Delete</button>' +
						'</td></tr>';
				});
				body += '</tbody></table></p>';
				$('#domains').html(body);
				js_panel_generate("site");
				returndata();

			})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function js_panel_generate_blacklist(returndata) {
	var retbody = $.post('check.php', {
			id: "none",
			name: "none",
			action: "list",
			type: "blacklist"
		})
		.done(function (data, status) {
			var body = '<p><div class="hide alert alert-danger" id="blacklist_add_form_return">' +
				'<strong>Alert!</strong> IP were not added. This name already exists in the global list.' +
				'</div></p>' +
				'<form class="form-inline form_add form_error" id="blacklist_add_form" style="padding:10px 0px 10px">' +
				'<div class="form-group">' +
				'<input type="text" class="form-control" id="blacklist_add_input" placeholder="IP address[/mask]" minlength="7" required data-validator-name="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:|\/[1-2]?[0-9]|\/3[0-2])$">' +
				'</div>' +
				'<button type="submit" class="btn btn-primary">Add</button>' +
				'<span style="color:#bf9dff; display:none" id="blacklist_add_input_help" class="help-inline"> Wrong input type! Make sure you write ip in right format (4 numbers between 0 and 255 divided by dot) and mask (if exists) is between 0 and 32</span>' +
				'</form>' +
				'<table class="table table-striped table-bordered table-hover">' +
				'<thead><tr>' +
				'<th>IP Address[/mask]</th>' +
				'<th>Actions</th>' +
				'</tr></thead><tbody>';
			var arr = JSON.parse(data);
			jQuery.each(arr, function () {
				body +=
					'<tr><td>' +
					$(this)[0]["INET_NTOA(`IP`)"] + "/" + $(this)[0]["Mask"] +
					'</td><td>' +
					'<button type="button" id="blacklist ' + $(this)[0].ip_id + '" class="btn btn-danger btn-delete">Delete</button>' +
					'</td></tr>';
			});
			body += '</tbody></table></p>';
			$('#blacklist').html(body);
			returndata();


		})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

var asyncProcessed = 0;

function js_panel_generate_site(returndata) {
	$.post('check.php', {
			id: user_id,
			name: "none",
			action: "list",
			type: "site"
		})
		.done(function (data, status) {
			var arr = JSON.parse(data);
			var tablebody = '<p><div class="hide alert alert-danger" id="site_edit_modal_return">' +
				'<strong>Alert!</strong> Site were not added. This name already exists in the global list.' +
				'</div>' +
				'<table id="sites" class="display" cellspacing="0" width="100%">' +
				'<thead><tr>' +
				'<th>Site Name</th>' +
				'<th>Internal host</th>' +
				'<th>Internal Port</th>';
			if (!user_id) tablebody += '<th>Owner</th>';
			tablebody += '<th>Status</th>' +
				'<th>Shutdown Date</th>' +
				'<th>Actions</th>' +
				'</tr></thead>' +
				'<tfoot><tr>' +
				'<th>Site Name</th>' +
				'<th>Internal host</th>' +
				'<th>Internal  Port</th>';
			if (!user_id) tablebody += "<th>Owner</th>";
			tablebody += '<th>Status</th>' +
				'<th>Shutdown Date</th>' +
				'<th>Actions</th>' +
				'</tr></tfoot>' +
				'<tbody>';
			$.post('check.php', {
					id: "shared",
					action: "list",
					type: "domains"
				},
				function (data, status) {
					var mas = JSON.parse(data);

					jQuery.each(arr, function () {
						var selected = $(this)[0];
						var flag = false;
						jQuery.each(mas, function () {
							if ($(this)[0].domain_id == selected.domain_id) {
								flag = true;
								return false;
							}
						});
						tablebody += '<tr>' +
							'<td>' + '<a href="http://' + selected.site_name + '.' + selected.domain + '/">' + selected.site_name + '.' + selected.domain + '</a></td>' +
							'<td>' + selected.rhost + '</td>' +
							'<td>' + selected.rport + '</td>';
						if (!user_id) tablebody += '<td>' + selected.username + '</td>';
						tablebody += '<td>';
						if (selected.status == "Enabled" && flag) tablebody += '<span class="label label-success">Enabled</span>';
						else tablebody += '<span class="label label-warning">Disabled</span>';
						tablebody += '</td>' +
							'<td>' + selected.stop_date + '</td>' +
							'<td>' +
							'<button type="button" data-toggle="modal" data-target="#DomainsModal" id="site ' + selected.site_id + '" class="btn btn-primary btn-site-edit">Edit</button>';
						if (flag) {
							tablebody += '<button type="button" id="site ' + selected.site_id + '" class="btn btn-warning btn-switch">';
							if (selected.status == "Enabled") tablebody += 'Disable';
							else tablebody += 'Enable';
							tablebody += '</button>';
						}



						tablebody += '<button type="button" id="site ' + selected.site_id + '" class="btn btn-danger btn-delete">Delete</button>' +
							'</td>' +
							'</tr>';
						asyncProcessed++;
						if (asyncProcessed == arr.length) {
							asyncProcessed = 0;
							site_create_async_callback(tablebody);
							returndata();
						}
					});
					if (arr.length == 0) site_create_async_callback("<p><table><tbody></p>");
				});
		})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function site_create_async_callback(tablebody) {
	tablebody += '</tbody></table></p>';
	$('#sites_table_div').html(tablebody);
	$('#sites').DataTable();
}
//Check site already exist
function check_form_name_db(event) {
	$.post('check.php', {
			name: $(event).val(),
			proxy: $("#site_edit_modal_proxy").val(),
			action: "check",
			type: "site"
		})
		.done(
			function (data, status) {
				if (data.trim() != "[]") {
					$("#site_edit_modal_name_help").html("Site name already exist");
					event.attr("data-comment", "error");
					event.parent().closest('div').addClass("has-error");
					event.closest("form").find(':submit').addClass("disabled");
					$('#' + event.attr('id') + '_help').show();
				}

			})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function createNetmaskAddr(bitCount) {
	var mask = [];
	for (i = 0; i < 4; i++) {
		var n = Math.min(bitCount, 8);
		mask.push(256 - Math.pow(2, 8 - n));
		bitCount -= n;
	}
	return mask;
}

//Check host in blacklist
function check_form_blacklist_db(event) {
	$.post('check.php', {
			name: "none",
			proxy: $("#site_edit_modal_host").val(),
			action: "check",
			type: "blacklist"
		})
		.done(
			function (data, status) {
				var flag = false;
				var result = JSON.parse(data);
				if (result[0].result == "true") flag = true;
				if (flag) {
					$("#site_edit_modal_host_help").html("We can't use this IP (BlackList)");
					event.attr("data-comment", "error");
					event.parent().closest('div').addClass("has-error");
					event.closest("form").find(':submit').addClass("disabled");
					$('#' + event.attr('id') + '_help').show();
				};
			})
		.fail(function () {
			window.location.replace("/index.php");
		});
}
//Get activ sites for user
function count_sites() {
	$.post('check.php', {
			name: "none",
			action: "count",
			type: "site"
		})
		.done(
			function (data, status) {
				count = JSON.parse(data);
				$('#site_online').html("Active " + count["0"]["COUNT(site_id)"]);
			})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function count_vms() {
	$.post('check.php', {
			name: "none",
			action: "count",
			type: "vms",
			provider: "openstack"
		})
		.done(
			function (data, status) {
				count_vm = JSON.parse(data);
				$('#vm_online').html(count_vm["0"]["COUNT(vm_id)"]);
			})
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function show_notifications() {
	$('.notifymark').addClass('redicon');
	$('.notificationshiddengroup').html("");
	$('.notificationsvisiblegroup').html("");
	$.post('check.php', {
			name: "none",
			action: "list",
			type: "notifications"
		}).done(
			function (data, status) {
				var arr = JSON.parse(data);
				var counter = 0;
				jQuery.each(arr, function () {
					counter++;
					var disdel = "";
					var days = $(this)[0].days;
					if ($(this)[0].status != "Disabled") {
						var textbig = "Your " + $(this)[0].VM + " <b>" + $(this)[0].title + "</b> will be disabled soon!";
						if ($(this)[0].days < 0) days = 0;
						else days = $(this)[0].days;
						var textsmall = "Days left: " + days;
						if (counter <= 2) add_notification("index.php"+($(this)[0].VM=="site"?"?dashboard=Sites":""), textbig, textsmall, "visible");
						else add_notification("index.php"+($(this)[0].VM=="site"?"?dashboard=Sites":""), textbig, textsmall, "hidden");
					}
					if ($(this)[0].days < 0) {
						days = +Math.abs($('.notificationsallgroup').attr("data-days-before-delete")) + +$(this)[0].days;
						var textbig = "Your " + $(this)[0].VM + " <b>" + $(this)[0].title + "</b> will be deleted soon!";
						var textsmall = "Days left: " + days;
						if (counter <= 2) add_notification("index.php"+($(this)[0].VM=="site"?"?dashboard=Sites":""), textbig, textsmall, "visible");
						else add_notification("index.php"+($(this)[0].VM=="site"?"?dashboard=Sites":""), textbig, textsmall, "hidden");
					}
				})

				if (counter > 2 && !$("#expandnotifications").html()) {
					$('#notificationsdashboard').append('<a href="#notificationshiddendashboardgroup" data-toggle="collapse" id="expandnotifications" class="btn btn-default btn-block">Show all alerts</a>');
				} else if (!$('.notificationsvisiblegroup').html()) {
					$('.notificationsvisiblegroup').append('<a href="#" class="nolink">You have no notifications!</a>');
					$('.notifymark').removeClass('redicon');
				}
			}
		)
		.fail(function () {
			window.location.replace("/index.php");
		});
}

function add_notification(href, textbig, textsmall, group) {
	notibody = '<a href="' + href + '" class="list-group-item"><i class="fa fa-warning fa-fw"></i>';
	notibody += textbig;
	notibody += '<span class="pull-right text-muted small">' + textsmall + '</span>';
	notibody += '</a>';
	$('.notifications' + group + 'group').append(notibody);
}

function get_flavor() {
	$.post('check.php', {
			provider: $('#vms_form').attr("provider"),
			action: "flavor",
			type: "vm"
		}).done(
			function (data, status) {
				var arr = JSON.parse(data);
				if (arr.length>0)
				{
					var flavor = "";
					arr = arr.sort(function (a, b) {
						return ((a["VCPUs"] > b["VCPUs"]) ? 1 : ((a["VCPUs"] < b["VCPUs"]) ? -1 : ((a["RAM"] > b["RAM"]) ? 1 : ((a["RAM"] < b["RAM"]) ? -1 : ((a["Disk"] > b["Disk"]) ? 1 : ((a["Disk"] < b["Disk"]) ? -1 : 0))))));
					});
					jQuery.each(arr, function () {
						flavor += '<option value="' + this.Name + '">' + this.Name + ' (VCPUs:' + this.VCPUs + ', RAM:' + this.RAM + ', Disk:' + this.Disk + ')</option>';
					})
					$('#vms_form_flavor_list').html(flavor);
					flavorlist = arr;
				}
				else $('#vms_form_flavor_div').hide();
			}
		)
		.fail(function () {
			window.location.replace("/index.php");
		});

}

function get_images() {
	$.post('check.php', {
			provider: $('#vms_form').attr("provider"),
			action: "images",
			type: "vm"
		}).done(
			function (data, status) {
				var arr = JSON.parse(data);
				var images = "";
				jQuery.each(arr, function () {
					images += '<option value="' + this.ID + '">' + this.Name + '</option>';
				})
				$('#vms_form_image_list').html(images);
			}
		)
		.fail(function () {
			window.location.replace("/index.php");
		});

}

function get_keys() {
	var key = false;
	$.post('check.php', {
			provider: $('#vms_form').attr("provider"),
			id: user_id,
			name: "none",
			action: "list",
			type: "keys"
		}).done(
			function (data, status, use) {
				var arr = JSON.parse(data);
				var keys = "";
				jQuery.each(arr, function () {
					keys += '<option value="' + this.title + "_" + this.user_id + '">' + this.title + '</option>';
				})
				if (keys == "") {
					key = true;
					//keys = '<option>No keys</option>';
					$('.key_info').html('<div id="vms_form_edit_modal_key_help" class="alert alert-danger">' +
						'<strong>Error!</strong> SSH key missing! Please add public key <a href="/user/index.php?dashboard=Profile">here</a>.' +
						'</div>');
					return key;
				} else {
					$("[id^='vms_form_']").each(function () {
						$(this).prop("disabled", "")
					});
				}
				$('#vms_form_keypair_list').html(keys);
			}
		)
		.fail(function () {
			window.location.replace("/index.php");
		});
	return key;
}
