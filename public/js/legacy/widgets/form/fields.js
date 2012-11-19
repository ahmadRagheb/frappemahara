// Copyright (c) 2012 Web Notes Technologies Pvt Ltd (http://erpnext.com)
// 
// MIT License (MIT)
// 
// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// 

// fields.js
//
// Fields are divided into 2 types
// 1. Standard fields are loaded with the libarary
// 2. Special fields are loaded with form.compressed.js
//
//
// + wrapper
// 		+ input_area
//		+ display_area
// ======================================================================================
var no_value_fields = ['Section Break', 'Column Break', 'HTML', 'Table', 'FlexTable', 'Button', 'Image'];
var codeid=0; var code_editors={};

function Field() {	
	this.with_label = 1;
}

Field.prototype.make_body = function() { 
	var ischk = (this.df.fieldtype=='Check' ? 1 : 0);
	
	// parent element
	if(this.parent)
		this.wrapper = $a(this.parent, (this.with_label ? 'div' : 'span'));
	else
		this.wrapper = document.createElement((this.with_label ? 'div' : 'span'));

	this.label_area = $a(this.wrapper, 'div', '', {margin:'0px 0px 2px 0px', minHeight:'1em'});

	if(ischk && !this.in_grid) {
		this.input_area = $a(this.label_area, 'span', '', {marginRight:'4px'});
		this.disp_area = $a(this.label_area, 'span', '', {marginRight:'4px'});
	}
	
	// label
	if(this.with_label) {	
		this.label_span = $a(this.label_area, 'span', 'small')
	
		// error icon
		this.label_icon = $('<i class="icon icon-warning-sign">').toggle(false)
			.appendTo(this.label_area).css('margin-left','7px')
			.attr("title", "This field is mandatory.");

	} else {
		this.label_span = $a(this.label_area, 'span', '', {marginRight:'4px'})
		$dh(this.label_area);
	}

	// make the input areas
	if(!this.input_area) {
		this.input_area = $a(this.wrapper, (this.with_label ? 'div' : 'span'));
		this.disp_area = $a(this.wrapper, (this.with_label ? 'div' : 'span'));
	}

	// apply style
	if(this.in_grid) { 
		if(this.label_area) $dh(this.label_area);
	} else {
		this.input_area.className = 'input_area';
		$y(this.wrapper,{marginBottom:'9px'});
		
		// set description
		this.set_description();	
	}
	
	// bind label refresh

	if(this.onmake)this.onmake();
}


Field.prototype.set_max_width = function() {
	var no_max = ['Code', 'Text Editor', 'Text', 'Table', 'HTML']
	if(this.wrapper && this.layout_cell && this.layout_cell.parentNode.cells 
		&& this.layout_cell.parentNode.cells.length==1 && !in_list(no_max, this.df.fieldtype)) {
			$y(this.wrapper, {paddingRight:'50%'});
	}
}

Field.prototype.set_label = function() {
	if(this.with_label && this.label_area && this.label!=this.df.label) { 
		this.label_span.innerHTML = this.df.label;this.label = this.df.label; 
	}

}

Field.prototype.set_description = function() {
	if(this.df.description) {
		// parent
		var p = in_list(['Text Editor', 'Code', 'Check'], this.df.fieldtype) ? this.label_area : this.wrapper;
		this.desc_area = $a(p, 'div', 'help small', '', this.df.description)			

		// padding on the bottom
		if(in_list(['Text Editor', 'Code'], this.df.fieldtype))
			$(this.desc_area).addClass('help small');
	}
}

// Field Refresh
// --------------------------------------------------------------------------------------------

Field.prototype.get_status = function() {
	// if used in filters
	if(this.in_filter) 
		this.not_in_form = this.in_filter;
	
	if(this.not_in_form) {
		return 'Write';
	}

	if(!this.df.permlevel) this.df.permlevel = 0;

	var p = this.perm[this.df.permlevel];
	var ret;

	// permission level
	if(cur_frm.editable && p && p[WRITE] && !this.df.disabled)ret='Write';
	else if(p && p[READ])ret='Read';
	else ret='None';

	// binary
	if(this.df.fieldtype=='Binary')
		ret = 'None'; // no display for binary

	// hidden
	if(cint(this.df.hidden))
		ret = 'None';

	// for submit
	if(ret=='Write' && cint(cur_frm.doc.docstatus) > 0) ret = 'Read';

	// allow on submit
	var a_o_s = cint(this.df.allow_on_submit);
	
	if(a_o_s && (this.in_grid || (this.frm && this.frm.not_in_container))) {
		a_o_s = null;
		if(this.in_grid) a_o_s = this.grid.field.df.allow_on_submit; // take from grid
		if(this.frm && this.frm.not_in_container) { a_o_s = cur_grid.field.df.allow_on_submit;} // take from grid
	}
	
	if(cur_frm.editable && a_o_s && cint(cur_frm.doc.docstatus)>0 && !this.df.hidden) {
		tmp_perm = get_perm(cur_frm.doctype, cur_frm.docname, 1);
		if(tmp_perm[this.df.permlevel] && tmp_perm[this.df.permlevel][WRITE]) {
			ret='Write';
		}
	}

	return ret;
}

Field.prototype.set_style_mandatory = function(add) {
	if(add) {
		$(this.txt ? this.txt : this.input).addClass('input-mandatory');
		if(this.disp_area) $(this.disp_area).addClass('input-mandatory');		
	} else {
		$(this.txt ? this.txt : this.input).removeClass('input-mandatory');
		if(this.disp_area) $(this.disp_area).removeClass('input-mandatory');		
	}
}

Field.prototype.refresh_mandatory = function() { 
	if(this.in_filter)return;

	// mandatory changes
	if(this.df.reqd) {
		if(this.label_area) this.label_area.style.color= "#d22";
		this.set_style_mandatory(1);
	} else {
		if(this.label_area) this.label_area.style.color= "#222";
		this.set_style_mandatory(0);

	}
	
	this.refresh_label_icon()
	this.set_reqd = this.df.reqd;
}

Field.prototype.refresh_display = function() {
	// from permission
	if(!this.current_status || this.current_status!=this.disp_status) { // status changed
		if(this.disp_status=='Write') { // write
			if(this.make_input&&(!this.input)) { // make input if reqd
				this.make_input();
				if(this.txt || this.input)
					$(this.txt || this.input).addClass("mousetrap");
				if(this.onmake_input) this.onmake_input();				
			}
			
			if(this.show) this.show()
			else { $ds(this.wrapper); }
			
			// input or content
			if(this.input) { // if there, show it!
				$ds(this.input_area);
				$dh(this.disp_area);
				if(this.input.refresh)this.input.refresh();
			} else { // no widget
				$dh(this.input_area);
				$ds(this.disp_area);
			}
		} else if(this.disp_status=='Read') { 
			
			// read
			if(this.show) this.show()
			else { $ds(this.wrapper); }

			$dh(this.input_area);
			$ds(this.disp_area);

		} else { 
			
			// None - hide all
			if(this.hide) this.hide();
			else $dh(this.wrapper);
		}
		this.current_status = this.disp_status;
	}
}

Field.prototype.refresh = function() {
	// get status
	this.disp_status = this.get_status();

	// if there is a special refresh in case of table, then this is not valid
	if(this.in_grid 
		&& this.table_refresh 
			&& this.disp_status == 'Write') 
				{ this.table_refresh(); return; }

	this.set_label();
	this.refresh_display();
	
	// further refresh	
	if(this.onrefresh) 
		this.onrefresh(); // called by various fields
		
	if(this.input) {
		if(this.input.refresh) this.input.refresh(this.df);
	}
	if(this.wrapper) {
		this.wrapper.fieldobj = this;
		$(this.wrapper).trigger('refresh');		
	}
	

	if(!this.not_in_form)
		this.set_input(_f.get_value(this.doctype,this.docname,this.df.fieldname));

	this.refresh_mandatory();	
	this.set_max_width();
}

Field.prototype.refresh_label_icon = function() {	
	// mandatory
	var to_update = false;
	if(this.df.reqd && this.get_value && is_null(this.get_value())) 
		to_update = true;
		
	if(!to_update && this.df.has_error) this.df.has_error = false;

	if(this.label_icon) this.label_icon.css("display", (to_update ? "inline-block" : "none"));
	$(this.txt ? this.txt : this.input).toggleClass('field-to-update', to_update);
	
	$(this.txt ? this.txt : this.input).toggleClass('field-has-error', 
		this.df.has_error ? true : false);
}

// Set / display values
// --------------------------------------------------------------------------------------------

Field.prototype.set = function(val) {
	// not in form
	if(this.not_in_form)
		return;
			
	if((!this.docname) && this.grid) {
		this.docname = this.grid.add_newrow(); // new row
	}
	
	if(this.validate)
		val = this.validate(val);
	cur_frm.set_value_in_locals(this.doctype, this.docname, this.df.fieldname, val);
	this.value = val; // for return
}

Field.prototype.set_input = function(val) {
	this.value = val;
	if(this.input&&this.input.set_input) {
		if(val==null)this.input.set_input('');
		else this.input.set_input(val); // in widget
	}
	var disp_val = val;
	if(val==null) disp_val = ''; 
	this.set_disp(disp_val); // text
}

Field.prototype.run_trigger = function() {
	// update mandatory icon
	this.refresh_label_icon();

	if(this.not_in_form) {
		return;
	}

	if(cur_frm.cscript[this.df.fieldname])
		cur_frm.runclientscript(this.df.fieldname, this.doctype, this.docname);

	cur_frm.refresh_dependency();
}

Field.prototype.set_disp_html = function(t) {
	if(this.disp_area){
		$(this.disp_area).addClass('disp_area');

		this.disp_area.innerHTML = (t==null ? '' : t);
		if(!t) $(this.disp_area).addClass('disp_area_no_val');
	}
}

Field.prototype.set_disp = function(val) { 
	this.set_disp_html(val);
}

// Show in GRID
// --------------------------------------------------------------------------------------------

// for grids (activate against a particular record in the table
Field.prototype.activate = function(docname) {
	this.docname = docname;
	this.refresh();

	if(this.input) {
		var v = _f.get_value(this.doctype, this.docname, this.df.fieldname);
		this.last_value=v;
		// set input value

		if(this.input.onchange && this.input.get_value && this.input.get_value() !=v) {
			if(this.validate)
				this.input.set_value(this.validate(v));
			else 
				this.input.set_value((v==null)?'':v);
			if(this.format_input)
				this.format_input();
		}
		
		if(this.input.focus){
			try{this.input.focus();} catch(e){} // IE Fix - Unexpected call???
		}
	}
	if(this.txt) {
		try{this.txt.focus();} catch(e){} // IE Fix - Unexpected call???
		this.txt.field_object = this;
	}
}
// ======================================================================================

function DataField() { } DataField.prototype = new Field();
DataField.prototype.make_input = function() {
	var me = this;
	this.input = $a_input(this.input_area, this.df.fieldtype=='Password' ? 'password' : 'text');

	this.get_value= function() {
		var v = this.input.value;
		if(this.validate)
			v = this.validate(v);
		return v;
	}

	this.input.name = this.df.fieldname;
	
	$(this.input).change(function() {
		//me.set_value(me.get_value && me.get_value() || $(this.input).val());
		
		// fix: allow 0 as value
		me.set_value(me.get_value ? me.get_value() : $(this.input).val());
	});
	
	this.set_value = function(val) {
		if(!me.last_value)me.last_value='';

		if(me.validate) {
			val = me.validate(val);
			me.input.value = val==undefined ? '' : val;
		}

		me.set(val);
		if(me.format_input)
			me.format_input();
		if(in_list(['Currency','Float','Int'], me.df.fieldtype)) {
			if(flt(me.last_value)==flt(val)) {
				me.last_value = val;
				return; // do not run trigger
			}
		}
		me.last_value = val;
		me.run_trigger();
	}
	this.input.set_input = function(val) { 
		if(val==null)val='';
		me.input.value = val; 
		if(me.format_input)me.format_input();
	}
}
DataField.prototype.validate = function(v) {
	if(this.df.options == 'Phone') {
		if(v+''=='')return '';
		v1 = ''
		// phone may start with + and must only have numbers later, '-' and ' ' are stripped
		v = v.replace(/ /g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');

		// allow initial +,0,00
		if(v && v.substr(0,1)=='+') {
			v1 = '+'; v = v.substr(1);
		}
		if(v && v.substr(0,2)=='00') {
			v1 += '00'; v = v.substr(2);
		} 
		if(v && v.substr(0,1)=='0') {
			v1 += '0'; v = v.substr(1);
		}
		v1 += cint(v) + '';
		return v1;
	} else if(this.df.options == 'Email') {
		if(v+''=='')return '';
		if(!validate_email(v)) {
			msgprint(this.df.label + ': ' + v + ' is not a valid email id');
			return '';
		} else
			return v;
	} else {
		return v;	
	}	
}

// ======================================================================================

function ReadOnlyField() { }
ReadOnlyField.prototype = new Field();

// ======================================================================================

function HTMLField() { } 
HTMLField.prototype = new Field();
HTMLField.prototype.with_label = 0;
HTMLField.prototype.set_disp = function(val) { if(this.disp_area) this.disp_area.innerHTML = val; }
HTMLField.prototype.set_input = function(val) { if(val) this.set_disp(val); }
HTMLField.prototype.onrefresh = function() { if(this.df.options) this.set_disp(this.df.options); }

// ======================================================================================

var datepicker_active = 0;

function DateField() { } DateField.prototype = new Field();
DateField.prototype.make_input = function() {

	var me = this;
	this.user_fmt = sys_defaults.date_format;
	if(!this.user_fmt)this.user_fmt = 'dd-mm-yy';

	this.input = $a(this.input_area, 'input');

	$(this.input).datepicker({
		dateFormat: me.user_fmt.replace('yyyy','yy'), 
		altFormat:'yy-mm-dd', 
		changeYear: true,
		beforeShow: function(input, inst) { 
			datepicker_active = 1 
		},
		onClose: function(dateText, inst) { 
			datepicker_active = 0;
			if(_f.cur_grid_cell)
				_f.cur_grid_cell.grid.cell_deselect();	
		}
	});
	
	var me = this;

	me.input.onchange = function() {
		// input as dd-mm-yyyy
		if(this.value==null)this.value='';

		if(!this.not_in_form)
			me.set(dateutil.user_to_str(me.input.value));

		me.run_trigger();
	}
	me.input.set_input = function(val) {
		if(val==null)val='';
		else val=dateutil.str_to_user(val);
		me.input.value = val;
	}
	me.get_value = function() {
		if(me.input.value)
			return dateutil.user_to_str(me.input.value);
	}
}
DateField.prototype.set_disp = function(val) {
	var v = dateutil.str_to_user(val);
	if(v==null)v = '';
	this.set_disp_html(v);
}
DateField.prototype.validate = function(v) {
	if(!v) return;
	var me = this;
	this.clear = function() {
		msgprint ("Date must be in format " + this.user_fmt);
		me.input.set_input('');
		return '';
	}
	var t = v.split('-');
	if(t.length!=3) { return this.clear(); }
	else if(cint(t[1])>12 || cint(t[1])<1) { return this.clear(); }
	else if(cint(t[2])>31 || cint(t[2])<1) { return this.clear(); }
	return v;
};

// ======================================================================================

// reference when a new record is created via link
function LinkField() { } LinkField.prototype = new Field();
LinkField.prototype.make_input = function() { 
	var me = this;
	
	if(me.df.no_buttons) {
		this.txt = $a(this.input_area, 'input');
		this.input = this.txt;	
	} else {
		makeinput_popup(this, 'icon-search', 'icon-play', 'icon-plus');
	
		// setup buttons
		me.setup_buttons();

		me.onrefresh = function() {
			if(me.can_create) 
				$(me.btn2).css('display', 'inline-block');
			else $dh(me.btn2);
		}
	}


	me.txt.field_object = this;		
	// set onchange triggers

	me.input.set_input = function(val) {
		if(val==undefined)val='';
		me.txt.value = val;
	}

	me.get_value = function() { return me.txt.value; }

	$(me.txt).autocomplete({
		source: function(request, response) {
			wn.call({
				method:'webnotes.widgets.search.search_link',
				args: {
					'txt': request.term, 
					'dt': me.df.options,
					'query': me.get_custom_query()
				},
				callback: function(r) {
					response(r.results);
				},
			});
		},
		select: function(event, ui) {
			me.set_input_value(ui.item.value);
		}
	}).data('autocomplete')._renderItem = function(ul, item) {
		return $('<li></li>')
			.data('item.autocomplete', item)
			.append(repl('<a>%(label)s<br><span style="font-size:10px">%(info)s</span></a>', item))
			.appendTo(ul);
	};
	
	$(this.txt).change(function() {
		var val = $(this).val();//me.get_value();

		me.set_input_value_executed = false;
		
		if(!val) {
			if(selector && selector.display) 
				return;
			me.set_input_value('');			
		} else {
			// SetTimeout hack! if in put is set via autocomplete, do not validate twice
			setTimeout(function() {
				if (!me.set_input_value_executed) {
					me.set_input_value(val);
				}
			}, 1000);
		}
	})
}

LinkField.prototype.get_custom_query = function() {
	this.set_get_query();
	if(this.get_query) {
		if(cur_frm)
			var doc = locals[cur_frm.doctype][cur_frm.docname];
		return this.get_query(doc, this.doctype, this.docname);
	}
}

LinkField.prototype.setup_buttons = function() { 
	var me = this;
	
	// magnifier - search
	me.btn.onclick = function() {
		selector.set(me, me.df.options, me.df.label);
		selector.show(me.txt);
	}

	// open
	if(me.btn1)me.btn1.onclick = function() {
		if(me.txt.value && me.df.options) { loaddoc(me.df.options, me.txt.value); }
	}	
	// add button - for inline creation of records
	me.can_create = 0;
	if((!me.not_in_form) && in_list(profile.can_create, me.df.options)) {
		me.can_create = 1;
		me.btn2.onclick = function() { 
			var on_save_callback = function(new_rec) {
				if(new_rec) {
					var d = _f.calling_doc_stack.pop(); // patch for composites
					
					locals[d[0]][d[1]][me.df.fieldname] = new_rec;
					me.refresh();
					
					if(me.grid)me.grid.refresh();
					
					// call script
					me.run_trigger();					
				}
			}
			_f.calling_doc_stack.push([me.doctype, me.docname]);
			new_doc(me.df.options); 
		}
	} else {
		$dh(me.btn2); $y($td(me.tab,0,2), {width:'0px'});
	}
}

LinkField.prototype.set_input_value = function(val) {
	var me = this;
	
	// SetTimeout hack! if in put is set via autocomplete, do not validate twice
	me.set_input_value_executed = true;

	var from_selector = false;
	if(selector && selector.display) from_selector = true;
		
	// refresh mandatory style
	me.refresh_label_icon();
	
	// not in form, do nothing
	if(me.not_in_form) {
		$(this.txt).val(val);
		return;
	}
	
	// same value, do nothing
	if(cur_frm) {
		if(val == locals[me.doctype][me.docname][me.df.fieldname]) { 
			//me.set(val); // one more time, grid bug?
			me.run_trigger(); // wanted - called as refresh?
			return; 
		}
	}
	
	// set in locals
	me.set(val);
	
	// deselect cell if in grid
	if(_f.cur_grid_cell)
		_f.cur_grid_cell.grid.cell_deselect();
	
	// run trigger if value is cleared
	if(locals[me.doctype][me.docname][me.df.fieldname] && !val) {
		me.run_trigger();
		return;
	}

	// validate only if val is not empty
	if (val) { me.validate_link(val, from_selector); }
}

LinkField.prototype.validate_link = function(val, from_selector) {
	// validate the value just entered
	var me = this;

	if(this.df.options=="[Select]") {
		$(me.txt).val(val);
		me.run_trigger();
		return;		
	}

	var fetch = '';
	if(cur_frm.fetch_dict[me.df.fieldname])
		fetch = cur_frm.fetch_dict[me.df.fieldname].columns.join(', ');
		
	$c('webnotes.widgets.form.utils.validate_link', {
			'value':val, 
			'options':me.df.options, 
			'fetch': fetch
		}, 
		function(r,rt) {
			if(r.message=='Ok') {
				// set fetch values
				if($(me.txt).val()!=val) {
					if((me.grid && !from_selector) || (!me.grid)) {
						$(me.txt).val(val);
					}
				}
				
				if(r.fetch_values) 
					me.set_fetch_values(r.fetch_values);

				me.run_trigger();
			} else {
				var astr = '';
				if(in_list(profile.can_create, me.df.options)) astr = repl('<br><br><span class="link_type" onclick="newdoc(\'%(dt)s\')">Click here</span> to create a new %(dtl)s', {dt:me.df.options, dtl:get_doctype_label(me.df.options)})
				msgprint(repl('error:<b>%(val)s</b> is not a valid %(dt)s.<br><br>You must first create a new %(dt)s <b>%(val)s</b> and then select its value. To find an existing %(dt)s, click on the magnifying glass next to the field.%(add)s', {val:me.txt.value, dt:get_doctype_label(me.df.options), add:astr})); 
				me.txt.value = ''; 
				me.set('');
			}
		}
	);
}

LinkField.prototype.set_fetch_values = function(fetch_values) { 
	var fl = cur_frm.fetch_dict[this.df.fieldname].fields;
	var changed_fields = [];
	for(var i=0; i< fl.length; i++) {
		if(locals[this.doctype][this.docname][fl[i]]!=fetch_values[i]) {
			locals[this.doctype][this.docname][fl[i]] = fetch_values[i];
			if(!this.grid) {
				refresh_field(fl[i]);
				
				// call trigger on the target field
				changed_fields.push(fl[i]);
			}
		}
	}
	
	// run triggers
	for(i=0; i<changed_fields.length; i++) {
		if(cur_frm.fields_dict[changed_fields[i]]) // on main
			cur_frm.fields_dict[changed_fields[i]].run_trigger();
	}
	
	// refresh grid
	if(this.grid) this.grid.refresh();
}

LinkField.prototype.set_get_query = function() { 
	if(this.get_query)return;

	if(this.grid) {
		var f = this.grid.get_field(this.df.fieldname);
		if(f.get_query) this.get_query = f.get_query;
	}
}

LinkField.prototype.set_disp = function(val) {
	var t = null; 
	if(val)t = "<a href=\'javascript:loaddoc(\""+this.df.options+"\", \""+val+"\")\'>"+val+"</a>";
	this.set_disp_html(t);
}

// ======================================================================================

function IntField() { } IntField.prototype = new DataField();
IntField.prototype.validate = function(v) {
	if(isNaN(parseInt(v)))return null;
	return cint(v);
}; 
IntField.prototype.format_input = function() {
	if(this.input.value==null) this.input.value='';
}

// ======================================================================================

function FloatField() { } FloatField.prototype = new DataField();
FloatField.prototype.validate = function(v) {
	var v= parseFloat(v); 
	if(isNaN(v))
		return null;
	return v;
};
FloatField.prototype.format_input = function() {
	if(this.input.value==null) this.input.value='';
}

// ======================================================================================

function CurrencyField() { } CurrencyField.prototype = new DataField();
CurrencyField.prototype.format_input = function() { 
	var v = fmt_money(this.input.value); 
	if(this.not_in_form) {
		if(!flt(this.input.value)) v = ''; // blank in filter
	}
	this.input.value = v;
}

CurrencyField.prototype.validate = function(v) { 
	if(v==null || v=='')
		return 0;
	return flt(v,2); 
}
CurrencyField.prototype.set_disp = function(val) { 
	var v = fmt_money(val); 
	this.set_disp_html(v);
}
CurrencyField.prototype.onmake_input = function() {
	if(!this.input) return;
	this.input.onfocus = function() {
		if(flt(this.value)==0)this.select();
	}
}

// ======================================================================================

function CheckField() { } CheckField.prototype = new Field();
CheckField.prototype.validate = function(v) {
	var v= parseInt(v); if(isNaN(v))return 0;
	return v;
}; 
CheckField.prototype.onmake = function() {
	this.checkimg = $a(this.disp_area, 'div');
	var img = $a(this.checkimg, 'img');
	img.src = 'lib/images/ui/tick.gif';
	$dh(this.checkimg);
}

CheckField.prototype.make_input = function() { var me = this;
	this.input = $a_input(this.input_area,'checkbox');
	$y(this.input, {width:"16px", border:'0px', margin:'2px'}); // no specs for checkbox
	
	$(this.input).click(function() {
		me.set(this.checked?1:0);
		me.run_trigger();		
	})
	
	this.input.set_input = function(v) {
		v = parseInt(v); if(isNaN(v)) v = 0;
		if(v) me.input.checked = true;
		else me.input.checked=false;
	}

	this.get_value= function() {
		return this.input.checked?1:0;
	}

}
CheckField.prototype.set_disp = function(val) {
	if (val){ $ds(this.checkimg); } 
	else { $dh(this.checkimg); }
}

// ======================================================================================


function TextField() { } TextField.prototype = new Field();
TextField.prototype.set_disp = function(val) { 
	this.disp_area.innerHTML = replace_newlines(val);
}
TextField.prototype.make_input = function() {
	var me = this; 
	
	if(this.in_grid)
		return; // do nothing, text dialog will take over
	
	this.input = $a(this.input_area, 'textarea');
	if(this.df.fieldtype=='Small Text')
		this.input.style.height = "80px";
	this.input.set_input = function(v) {
		me.input.value = v;
	}
	this.input.onchange = function() {
		me.set(me.input.value); 
		me.run_trigger();
	}
	this.get_value= function() {
		return this.input.value;
	}
}

// text dialog
var text_dialog;
function make_text_dialog() {
	var d = new Dialog(520,410,'Edit Text');
	d.make_body([
		['Text', 'Enter Text'],
		['HTML', 'Description'],
		['Button', 'Update']
	]);
	d.widgets['Update'].onclick = function() {
		var t = this.dialog;
		t.field.set(t.widgets['Enter Text'].value);
		t.hide();
	}
	d.onshow = function() {
		this.widgets['Enter Text'].style.height = '300px';
		var v = _f.get_value(this.field.doctype,this.field.docname,this.field.df.fieldname);
		this.widgets['Enter Text'].value = v==null?'':v;
		this.widgets['Enter Text'].focus();
		this.widgets['Description'].innerHTML = ''
		if(this.field.df.description)
			$a(this.widgets['Description'], 'div', 'help small', '', this.field.df.description);
	}
	d.onhide = function() {
		if(_f.cur_grid_cell)
			_f.cur_grid_cell.grid.cell_deselect();
	}
	text_dialog = d;
}

TextField.prototype.table_refresh = function() {
	if(!this.text_dialog)
		make_text_dialog();
	text_dialog.set_title('Enter text for "'+ this.df.label +'"'); 
	text_dialog.field = this;
	text_dialog.show();
}


// Select
// ======================================================================================

function SelectField() { } SelectField.prototype = new Field();
SelectField.prototype.make_input = function() { 
	var me = this;
	var opt=[];
	
	if(this.in_filter && (!this.df.single_select)) {
		// multiple select
		this.input = $a(this.input_area, 'select');
		this.input.multiple = true;
		this.input.style.height = '4em';
		this.input.lab = $a(this.input_area, 'div', {fontSize:'9px',color:'#999'});
		this.input.lab.innerHTML = '(Use Ctrl+Click to select multiple or de-select)'
	} else {

		// Single select
		this.input = $a(this.input_area, 'select');
		
		this.input.onchange = function() {
			if(me.validate)
				me.validate();
			me.set(sel_val(this));
			me.run_trigger();
		}
		
		if(this.df.options == 'attach_files:') {
			this.file_attach = true;
		}
	}

	// set as single (to be called from report builder)
	this.set_as_single = function() {
		var i = this.input;
		i.multiple = false;
		i.style.height = null;
		if(i.lab)$dh(i.lab)
	}
	
	// refresh options list
	this.refresh_options = function(options) {		
		if(options)
			me.df.options = options;

		if(this.file_attach)
			this.set_attach_options();
		
		me.options_list = me.df.options?me.df.options.split('\n'):[''];
		
		// add options
		empty_select(this.input);
		if(me.in_filter && me.options_list[0]!='') {
			me.options_list = add_lists([''], me.options_list);			
		}
		add_sel_options(this.input, me.options_list);
	}
	
	// refresh options
	this.onrefresh = function() {
		this.refresh_options();

		if(this.not_in_form) {
			this.input.value = '';
			return;
		}
		
		if(_f.get_value)
			var v = _f.get_value(this.doctype,this.docname,this.df.fieldname);
		else {
			if(this.options_list && this.options_list.length)
				var v = this.options_list[0];
			else
				var v = null;
		}
		this.input.set_input(v);
	}
	
	this.input.set_input=function(v) {
		if(!v) {
			if(!me.input.multiple) {
				if(me.docname) { // if called from onload without docname being set on fields
					if(me.options_list && me.options_list.length) {
						me.set(me.options_list[0]);
						me.input.value = me.options_list[0];
					} else {
						me.input.value = '';
					}
				}
			}
		} else {
			if(me.options_list) {
				if(me.input.multiple) {
					for(var i=0; i<me.input.options.length; i++) {
						me.input.options[i].selected = 0;
						if(me.input.options[i].value && inList(typeof(v)=='string'?v.split(","):v, me.input.options[i].value))
							me.input.options[i].selected = 1;
					}
				} else if(in_list(me.options_list, v)){
					me.input.value = v;
				}
			}
		}
	}
	this.get_value= function() {
		if(me.input.multiple) {
			var l = [];
			for(var i=0;i<me.input.options.length; i++ ) {
				if(me.input.options[i].selected)l[l.length] = me.input.options[i].value;
			}
			return l;
		} else {
			if(me.input.options) {
				var val = sel_val(me.input);
				if(!val && !me.input.selectedIndex)
					val = me.input.options[0].value;
				return val;
			}
			return me.input.value;
		}
	}
	
	this.set_attach_options = function() {
		if(!cur_frm) return;
		var fl = cur_frm.doc.file_list;
		if(fl) {
			this.df.options = '';
			var fl = fl.split('\n');
			for(var i in fl) {
				this.df.options += '\n' + fl[i].split(',')[1];
			}
		} else {
			this.df.options = ''
		}
	}
	this.refresh();
}

// Time
// ======================================================================================

function TimeField() { } TimeField.prototype = new Field();

TimeField.prototype.get_time = function() {
	return time_to_hhmm(sel_val(this.input_hr), sel_val(this.input_mn), sel_val(this.input_am));
}
TimeField.prototype.set_time = function(v) {	
	//show_alert(ret);
	ret = time_to_ampm(v);
	this.input_hr.inp.value = ret[0];
	this.input_mn.inp.value = ret[1];
	this.input_am.inp.value = ret[2];
}

TimeField.prototype.set_style_mandatory = function() { }

TimeField.prototype.make_input = function() { var me = this;
	this.input = $a(this.input_area, 'div', 'time_field');
	
	var t = make_table(this.input, 1, 3, '200px');

	var opt_hr = ['1','2','3','4','5','6','7','8','9','10','11','12'];
	var opt_mn = ['00','05','10','15','20','25','30','35','40','45','50','55'];
	var opt_am = ['AM','PM'];

	this.input_hr = new SelectWidget($td(t,0,0), opt_hr, '50px');
	this.input_mn = new SelectWidget($td(t,0,1), opt_mn, '50px');
	this.input_am = new SelectWidget($td(t,0,2), opt_am, '50px');
	
	var onchange_fn = function() {
		me.set(me.get_time()); 
		me.run_trigger();
	}
	
	this.input_hr.inp.onchange = onchange_fn;
	this.input_mn.inp.onchange = onchange_fn;
	this.input_am.inp.onchange = onchange_fn;
	
	this.onrefresh = function() {
		var v = _f.get_value ? _f.get_value(me.doctype,me.docname,me.df.fieldname) : null;
		me.set_time(v);
		if(!v)
			me.set(me.get_time());
	}
	
	this.input.set_input=function(v) {
		if(v==null)v='';
		me.set_time(v);
	}

	this.get_value = function() {
		return this.get_time();
	}
	this.refresh();
}

TimeField.prototype.set_disp=function(v) {
	var t = time_to_ampm(v);
	var t = t[0]+':'+t[1]+' '+t[2];
	this.set_disp_html(t);
}

// ======================================================================================
// Used by date and link fields

function makeinput_popup(me, iconsrc, iconsrc1, iconsrc2) {
	
	var icon_style = {cursor: 'pointer', width: '16px', verticalAlign:'middle',
		marginBottom:'-3px'};
	
	me.input = $a(me.input_area, 'div');
	if(!me.not_in_form)
		$y(me.input, {width:'80%'});
		
	me.input.set_width = function(w) {
		$y(me.input, {width:(w-2)+'px'});
	}
	
	var tab = $a(me.input, 'table');
	me.tab = tab;
	
	$y(tab, {width:'100%', borderCollapse:'collapse', tableLayout:'fixed'});
	
	var c0 = tab.insertRow(0).insertCell(0);
	var c1 = tab.rows[0].insertCell(1);
	
	$y(c1,{width: '20px'});
	me.txt = $a($a($a(c0, 'div', '', {paddingRight:'8px'}), 'div'), 'input', '', {width:'100%'});

	me.btn = $a(c1, 'i', iconsrc, icon_style)

	if(iconsrc1) // link
		me.btn.setAttribute('title','Search');
	else // date
		me.btn.setAttribute('title','Select Date');

	if(iconsrc1) {
		var c2 = tab.rows[0].insertCell(2);
		$y(c2,{width: '20px'});
		me.btn1 = $a(c2, 'i', iconsrc1, icon_style)
		me.btn1.setAttribute('title','Open Link');
	}

	if(iconsrc2) {
		var c3 = tab.rows[0].insertCell(3);
		$y(c3,{width: '20px'});
		me.btn2 = $a(c3, 'i', iconsrc2, icon_style)
		me.btn2.setAttribute('title','Create New');
		$dh(me.btn2);
	}
		
	me.txt.name = me.df.fieldname;

	me.setdisabled = function(tf) { me.txt.disabled = tf; }
}


var tmpid = 0;

// ======================================================================================

_f.ButtonField = function() { };
_f.ButtonField.prototype = new Field();
_f.ButtonField.prototype.with_label = 0;
_f.ButtonField.prototype.init = function() {
	this.prev_button = null;
	// if previous field is a button, add it to the same div!
	
	// button-set structure
	// + wrapper (1st button)
	// 		+ input_area
	//			+ button_area
	//			+ button_area
	//			+ button_area
	
	if(!this.frm) return;
	
	if(cur_frm && 
		cur_frm.fields[cur_frm.fields.length-1] &&
			cur_frm.fields[cur_frm.fields.length-1].df.fieldtype=='Button') {
				
		this.make_body = function() {
			this.prev_button = cur_frm.fields[cur_frm.fields.length-1];
			if(!this.prev_button.prev_button) {
				// first button, make the button area
				this.prev_button.button_area = $a(this.prev_button.input_area, 'span');
			}
			this.wrapper = this.prev_button.wrapper;
			this.input_area = this.prev_button.input_area;
			this.disp_area = this.prev_button.disp_area;
			
			// all buttons in the same input_area
			this.button_area = $a(this.prev_button.input_area, 'span');
		}
	}
}
_f.ButtonField.prototype.make_input = function() { var me = this;
	if(!this.prev_button) {
		$y(this.input_area,{marginTop:'4px', marginBottom: '4px'});
	}

	// make a button area for one button
	if(!this.button_area) 
		this.button_area = $a(this.input_area, 'span','',{marginRight:'4px'});
	
	// make the input
	this.input = $btn(this.button_area, 
		me.df.label, null, 
		{fontWeight:'bold'}, null, 1)

	$(this.input).click(function() {
		if(me.not_in_form) return;
		
		if(cur_frm.cscript[me.df.fieldname] && (!me.in_filter)) {
			cur_frm.runclientscript(me.df.fieldname, me.doctype, me.docname);
		} else {
			cur_frm.runscript(me.df.options, me);
		}
	});
}

_f.ButtonField.prototype.hide = function() { 
	$dh(this.button_area);
};

_f.ButtonField.prototype.show = function() { 
	$ds(this.button_area);
};


_f.ButtonField.prototype.set = function(v) { }; // No Setter
_f.ButtonField.prototype.set_disp = function(val) {  } // No Disp on readonly

// ======================================================================================

function make_field(docfield, doctype, parent, frm, in_grid, hide_label) { // Factory

	switch(docfield.fieldtype.toLowerCase()) {
		
		// general fields
		case 'data':var f = new DataField(); break;
		case 'password':var f = new DataField(); break;
		case 'int':var f = new IntField(); break;
		case 'float':var f = new FloatField(); break;
		case 'currency':var f = new CurrencyField(); break;
		case 'read only':var f = new ReadOnlyField(); break;
		case 'link':var f = new LinkField(); break;
		case 'date':var f = new DateField(); break;
		case 'time':var f = new TimeField(); break;
		case 'html':var f = new HTMLField(); break;
		case 'check':var f = new CheckField(); break;
		case 'text':var f = new TextField(); break;
		case 'small text':var f = new TextField(); break;
		case 'select':var f = new SelectField(); break;
		case 'button':var f = new _f.ButtonField(); break;
		
		// form fields
		case 'code':var f = new _f.CodeField(); break;
		case 'text editor':var f = new _f.CodeField(); break;
		case 'table':var f = new _f.TableField(); break;
		case 'section break':var f= new _f.SectionBreak(); break;
		case 'column break':var f= new _f.ColumnBreak(); break;
		case 'image':var f= new _f.ImageField(); break;
	}

	f.parent 	= parent;
	f.doctype 	= doctype;
	f.df 		= docfield;
	f.perm 		= frm ? frm.perm : [[1,1,1]];
	if(_f)
		f.col_break_width = _f.cur_col_break_width;

	if(in_grid) {
		f.in_grid = true;
		f.with_label = 0;
	}
	if(hide_label) {
		f.with_label = 0;
	}
	if(frm) {
		f.frm = frm;
		if(parent)
			f.layout_cell = parent.parentNode;
	}
	if(f.init) f.init();
	f.make_body();
	return f;
}
