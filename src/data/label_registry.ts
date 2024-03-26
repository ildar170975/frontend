import { Connection, createCollection } from "home-assistant-js-websocket";
import { Store } from "home-assistant-js-websocket/dist/store";
import { stringCompare } from "../common/string/compare";
import { HomeAssistant } from "../types";
import { debounce } from "../common/util/debounce";

export interface LabelRegistryEntry {
  label_id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface LabelRegistryEntryMutableParams {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export const fetchLabelRegistry = (conn: Connection) =>
  conn
    .sendMessagePromise({
      type: "config/label_registry/list",
    })
    .then((labels) =>
      (labels as LabelRegistryEntry[]).sort((ent1, ent2) =>
        stringCompare(ent1.name, ent2.name)
      )
    );

export const subscribeLabelRegistryUpdates = (
  conn: Connection,
  store: Store<LabelRegistryEntry[]>
) =>
  conn.subscribeEvents(
    debounce(
      () =>
        fetchLabelRegistry(conn).then((labels: LabelRegistryEntry[]) =>
          store.setState(labels, true)
        ),
      500,
      true
    ),
    "label_registry_updated"
  );

export const subscribeLabelRegistry = (
  conn: Connection,
  onChange: (labels: LabelRegistryEntry[]) => void
) =>
  createCollection<LabelRegistryEntry[]>(
    "_labelRegistry",
    fetchLabelRegistry,
    subscribeLabelRegistryUpdates,
    conn,
    onChange
  );

export const createLabelRegistryEntry = (
  hass: HomeAssistant,
  values: LabelRegistryEntryMutableParams
) =>
  hass.callWS<LabelRegistryEntry>({
    type: "config/label_registry/create",
    ...values,
  });

export const updateLabelRegistryEntry = (
  hass: HomeAssistant,
  labelId: string,
  updates: Partial<LabelRegistryEntryMutableParams>
) =>
  hass.callWS<LabelRegistryEntry>({
    type: "config/label_registry/update",
    label_id: labelId,
    ...updates,
  });

export const deleteLabelRegistryEntry = (
  hass: HomeAssistant,
  labelId: string
) =>
  hass.callWS({
    type: "config/label_registry/delete",
    label_id: labelId,
  });
