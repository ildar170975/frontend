import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../common/dom/fire_event";
import type { LocalizeFunc } from "../../../../common/translations/localize";
import "../../../../components/ha-form/ha-form";
import type {
  HaFormSchema,
  SchemaUnion,
} from "../../../../components/ha-form/types";
import type { LovelaceBaseViewConfig } from "../../../../data/lovelace/config/view";
import type { HomeAssistant } from "../../../../types";

declare global {
  interface HASSDomEvents {
    "separator-config-changed": {
      config: LovelaceBaseViewConfig;
      valid?: boolean;
    };
  }
}

@customElement("hui-view-separator-editor")
export class HuiViewSeparatorEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config!: LovelaceBaseViewConfig;

  @state() private _error: Record<string, string> | undefined;

  private _schema = memoizeOne(
    (localize: LocalizeFunc) =>
      [
        {
          name: "separator_type",
          default: "separator",
          selector: {
            select: {
              options: ["separator", "spacer"].map((type) => ({
                value: type,
                label: localize(
                  `ui.panel.lovelace.editor.edit_view.separator_types.${type}`
                ),
              })),
            },
          },
        },
      ] as const satisfies HaFormSchema[]
  );

  set config(config: LovelaceBaseViewConfig) {
    this._config = config;
  }

  protected render() {
    if (!this.hass) {
      return nothing;
    }

    const schema = this._schema(this.hass.localize);

    const data = {
      ...this._config,
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        .computeError=${this._computeError}
        .error=${this._error}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    const config = ev.detail.value as LovelaceBaseViewConfig;

    let valid = true;
    this._error = undefined;
    if (!config.separator_type || config.title || config.path || config.icon) {
      valid = false;
      this._error = { path: "error_unsupported_option_views" };
    }

    fireEvent(this, "separator-config-changed", { valid, config });
  }

  private _computeError = (error: string) =>
    this.hass.localize(`ui.panel.lovelace.editor.edit_view.${error}` as any) ||
    error;

  private _computeLabel = (
    schema: SchemaUnion<ReturnType<typeof this._schema>>
  ) => {
    switch (schema.name) {
      case "separator_type":
        return this.hass.localize(
          `ui.panel.lovelace.editor.edit_view.${schema.name}`
        );
      default:
        return this.hass!.localize(
          `ui.panel.lovelace.editor.card.generic.${schema.name}`
        );
    }
  };

  private _computeHelper = (
    schema: SchemaUnion<ReturnType<typeof this._schema>>
  ) => {
    switch (schema.name) {
      case "separator_type":
        return this.hass.localize(
          `ui.panel.lovelace.editor.edit_view.${schema.name}_helper`
        );
      default:
        return undefined;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-view-separator-editor": HuiViewSeparatorEditor;
  }
}
