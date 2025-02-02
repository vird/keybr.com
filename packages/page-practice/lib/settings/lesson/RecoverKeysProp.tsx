import { lessonProps } from "@keybr/lesson";
import { useSettings } from "@keybr/settings";
import { CheckBox, Explainer, Field, FieldList } from "@keybr/widget";
import { type ReactNode } from "react";

export function RecoverKeysProp(): ReactNode {
  const { settings, updateSettings } = useSettings();
  return (
    <>
      <FieldList>
        <Field>Unlock a next key only when:</Field>
        <Field>
          <CheckBox
            label="The previous keys are also above the target speed"
            checked={settings.get(lessonProps.guided.recoverKeys)}
            onChange={(value) => {
              updateSettings(
                settings.set(lessonProps.guided.recoverKeys, value),
              );
            }}
          />
        </Field>
      </FieldList>
      <Explainer>
        When you focus on a new key, it is very likely that the speed of
        previous keys will decrease. If this option is disabled, you unlock a
        new key by raising only the focused key above the target speed. If this
        option is enabled, you will have to raise the focused key and all the
        previous keys above the target speed. This will make unlocking new keys
        harder. However, this will also make forgetting old keys harder.
      </Explainer>
    </>
  );
}
