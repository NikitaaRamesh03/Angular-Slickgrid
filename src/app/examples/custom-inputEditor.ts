import { Column, ColumnEditor, Editor, EditorValidator, EditorValidationResult, KeyCode } from './../modules/angular-slickgrid';

// using external non-typed js libraries
declare const $: any;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class CustomInputEditor implements Editor {
  private _lastInputEvent?: JQuery.Event;
  $input!: JQuery<HTMLInputElement>;
  defaultValue: any;

  constructor(private args: any) {
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args && this.args.column || {};
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef && this.columnDef.internalColumnEditor || {};
  }

  get hasAutoCommitEdit(): boolean {
    return this.args.grid.getOptions().autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor.validator || this.columnDef.validator;
  }

  init(): void {
    const placeholder = this.columnEditor && this.columnEditor.placeholder || '';
    const title = this.columnEditor && this.columnEditor.title || '';

    this.$input = $(`<input type="text" class="editor-text" placeholder="${placeholder}" title="${title}" />`)
      .appendTo(this.args.container)
      .on('keydown.nav', (event: JQuery.Event) => {
        this._lastInputEvent = event;
        if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT) {
          event.stopImmediatePropagation();
        }
      });

    // the lib does not get the focus out event for some reason
    // so register it here
    if (this.hasAutoCommitEdit) {
      this.$input.on('focusout', () => this.save());
    }

    setTimeout(() => {
      this.$input.focus().select();
    }, 50);
  }

  destroy() {
    this.$input.off('keydown.nav').remove();
  }

  focus() {
    this.$input.focus();
  }

  getValue() {
    return this.$input.val();
  }

  setValue(val: string) {
    this.$input.val(val);
  }

  loadValue(item: any) {
    this.defaultValue = item[this.args.column.field] || '';
    this.$input.val(this.defaultValue);
    this.$input[0].defaultValue = this.defaultValue;
    this.$input.select();
  }

  serializeValue() {
    return this.$input.val();
  }

  applyValue(item: any, state: any) {
    const validation = this.validate(state);
    item[this.args.column.field] = (validation && validation.valid) ? state : '';
  }

  isValueChanged() {
    const lastEvent = this._lastInputEvent?.keyCode;
    if (this.columnEditor?.alwaysSaveOnEnterKey && lastEvent === KeyCode.ENTER) {
      return true;
    }
    return (!(this.$input.val() === '' && this.defaultValue === null)) && (this.$input.val() !== this.defaultValue);
  }

  save() {
    const validation = this.validate();
    if (validation?.valid) {
      if (this.hasAutoCommitEdit) {
        this.args.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  validate(inputValue?: any): EditorValidationResult {
    if (this.validator) {
      const value = (inputValue !== undefined) ? inputValue : this.$input?.val();
      return this.validator(value, this.args);
    }

    return {
      valid: true,
      msg: null
    };
  }
}
