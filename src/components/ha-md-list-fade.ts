// import { styles } from "@material/web/list/internal/list-styles";
import { css, html, type TemplateResult } from "lit";
// type nothing, type TemplateResult
import { customElement, property, query } from "lit/decorators";
// import "./ha-md-list";
import { HaMdList } from "./ha-md-list";
import { ScrollableFadeMixin } from "../mixins/scrollable-fade-mixin";

@customElement("ha-md-list-fade")
export class HaMdListFade extends ScrollableFadeMixin(HaMdList) {
  @property({ type: Boolean, attribute: "enable-fade" })
  public enableFade = false;

  // @property({ attribute: false })
  // public items: HaMdListItem[] = [];

  @query(".wrapper") private _scrollableList?: HTMLDivElement;

  protected get scrollableElement(): HTMLElement | null {
    return this._scrollableList as HTMLElement | null;
  }

  protected render(): TemplateResult | any {
    if (!this.enableFade) return super.render();
    // prettier-ignore
    return html`<div class="wrapper">
      ${super.render()}
      ${this.renderScrollableFades()}
    </div>`;
  }

  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --md-sys-color-surface: var(--card-background-color);
        }
        .wrapper {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-md-list-fade": HaMdListFade;
  }
}
