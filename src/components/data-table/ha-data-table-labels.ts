import type { TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import { repeat } from "lit/directives/repeat";
import memoizeOne from "memoize-one";
import { computeCssColor } from "../../common/color/compute-color";
import { fireEvent } from "../../common/dom/fire_event";
import { stopPropagation } from "../../common/dom/stop_propagation";
import { stringCompare } from "../../common/string/compare";
import type { LabelRegistryEntry } from "../../data/label/label_registry";
import "../chips/ha-chip-set";
import "../ha-dropdown";
import "../ha-dropdown-item";
import type { HaDropdownItem } from "../ha-dropdown-item";
import "../ha-icon";
import "../ha-label";

type LabelItem = LabelRegistryEntry & {
  maxWidth: number | undefined;
};

@customElement("ha-data-table-labels")
class HaDataTableLabels extends LitElement {
  @property({ attribute: false }) public labels!: LabelRegistryEntry[];

  private _labelItems = memoizeOne(
    (labels: LabelRegistryEntry[], availableWidthPx?: number): LabelItem[] => {
      if (labels === null) {
        return [];
      }

      const sortedLabels = labels.sort((a, b) => stringCompare(a.name, b.name));

      if (availableWidthPx === undefined) {
        return sortedLabels.map((label) => ({
          ...label,
          maxWidth: undefined,
        }));
      }

      // total length in chars:
      const totalNamesLength = labels
        .map((label) => label.name)
        .join("").length;

      // calculating approx width in px:
      const dropdownWidthPx = labels.length > 2 ? 40 : 0; // approx width of "plus" chip
      const gapWidthPx = 4; // horiz spacing between chips
      const totalGapsWidthPx =
        labels.length > 2
          ? gapWidthPx * 2
          : labels.length === 2
            ? gapWidthPx
            : 0;

      return sortedLabels.map((label) => {
        const relativeNameWidth = label.name.length / totalNamesLength;
        // const otherPartsLengthPx = 40; // approx. length of icon + left/right paddings
        const relativeLabelWidth =
          relativeNameWidth +
          otherPartsLengthPx /
            (availableWidthPx - totalGapsWidthPx - dropdownWidthPx);

        const relativeWidth = 100;
        const maxWidthPx =
          (relativeWidth / 1) *
          (availableWidth - totalGapsWidth - dropdownWidth);
        return {
          ...label,
          maxWidth: Math.round(maxWidthPx),
        };
      });
    }
  );

  private _maxLabelsCount = 2;

  public availableWidth?: number = undefined;

  protected render(): TemplateResult {
    const labels = this._labelItems(this.labels, this.availableWidth);
    return html`
      <ha-chip-set>
        ${repeat(
          labels.slice(0, this._maxLabelsCount),
          (label) => label.label_id,
          (label) => this._renderLabel(label, true, label.maxWidth)
        )}
        ${labels.length > this._maxLabelsCount
          ? html`<ha-dropdown
              role="button"
              tabindex="0"
              @click=${stopPropagation}
              @wa-select=${this._handleDropdownSelect}
            >
              <ha-label slot="trigger" class="plus" dense>
                +${labels.length - this._maxLabelsCount}
              </ha-label>
              ${repeat(
                labels.slice(this._maxLabelsCount),
                (label) => label.label_id,
                (label) => html`
                  <ha-dropdown-item .value=${label.label_id} .item=${label}>
                    ${this._renderLabel(label, false)}
                  </ha-dropdown-item>
                `
              )}
            </ha-dropdown>`
          : nothing}
      </ha-chip-set>
    `;
  }

  private _renderLabel(
    label: LabelRegistryEntry,
    clickAction: boolean,
    maxLabelWidth?: number
  ) {
    const color = label?.color ? computeCssColor(label.color) : undefined;
    return html`
      <ha-label
        dense
        role="button"
        tabindex="0"
        .item=${label}
        @click=${clickAction ? this._labelClicked : undefined}
        @keydown=${clickAction ? this._labelClicked : undefined}
        style=${styleMap({
          "--color": color ?? "",
          maxWidth: `${maxLabelWidth}px`,
        })}
        .description=${label.description}
      >
        ${label?.icon
          ? html`<ha-icon slot="icon" .icon=${label.icon}></ha-icon>`
          : nothing}
        <div slot="name" class="label-name">${label.name}</div>
      </ha-label>
    `;
  }

  private _labelClicked(ev) {
    ev.stopPropagation();
    if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") {
      return;
    }
    const label = (ev.currentTarget as any).item as LabelRegistryEntry;
    fireEvent(this, "label-clicked", { label });
  }

  private _handleDropdownSelect(
    ev: CustomEvent<{ item: HaDropdownItem & { item?: LabelRegistryEntry } }>
  ) {
    const label = ev.detail?.item?.item;
    if (label) {
      fireEvent(this, "label-clicked", { label });
    }
  }

  static styles = css`
    :host {
      display: block;
      flex-grow: 1;
      margin-top: 4px;
      height: 22px;
    }
    ha-chip-set {
      position: fixed;
      flex-wrap: nowrap;
    }
    ha-label {
      --ha-label-background-color: var(--color, var(--grey-color));
      --ha-label-background-opacity: 0.5;
    }
    .label-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .plus {
      --ha-label-background-color: transparent;
      border: 1px solid var(--divider-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-data-table-labels": HaDataTableLabels;
  }
  interface HASSDomEvents {
    "label-clicked": { label: LabelRegistryEntry };
  }
}
