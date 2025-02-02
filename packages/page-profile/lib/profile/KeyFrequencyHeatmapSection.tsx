import { KeyFrequencyHeatmap, Marker } from "@keybr/chart";
import { useKeyboard } from "@keybr/keyboard";
import { type KeyStatsMap } from "@keybr/result";
import { Figure } from "@keybr/widget";
import { type ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export function KeyFrequencyHeatmapSection({
  keyStatsMap,
}: {
  readonly keyStatsMap: KeyStatsMap;
}): ReactNode {
  const keyboard = useKeyboard();
  return (
    <Figure>
      <Figure.Caption>
        <FormattedMessage
          id="profile.chart.keyFrequencyHeatmap.caption"
          description="Header text."
          defaultMessage="Key Frequency Heatmap"
        />
      </Figure.Caption>

      <Figure.Description>
        <FormattedMessage
          id="profile.chart.keyFrequencyHeatmap.description"
          description="Message text."
          defaultMessage="This chart shows relative key frequencies as a heatmap."
        />
      </Figure.Description>

      <KeyFrequencyHeatmap keyStatsMap={keyStatsMap} keyboard={keyboard} />

      <Figure.Legend>
        <FormattedMessage
          id="profile.chart.keyFrequencyHeatmap.legend"
          description="Message text."
          defaultMessage="Circle color: {label1} – hit count, {label2} – miss count."
          values={{
            label1: <Marker type="histogram-h" />,
            label2: <Marker type="histogram-m" />,
          }}
        />
      </Figure.Legend>
    </Figure>
  );
}
