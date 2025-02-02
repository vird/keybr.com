import { KeyFrequencyHistogram, Marker } from "@keybr/chart";
import { type KeyStatsMap } from "@keybr/result";
import { Figure } from "@keybr/widget";
import { type ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { ChartWrapper } from "./widgets.tsx";

export function KeyFrequencyHistogramSection({
  keyStatsMap,
}: {
  readonly keyStatsMap: KeyStatsMap;
}): ReactNode {
  return (
    <Figure>
      <Figure.Caption>
        <FormattedMessage
          id="profile.chart.keyFrequencyHistogram.caption"
          description="Header text."
          defaultMessage="Key Frequency Histogram"
        />
      </Figure.Caption>

      <Figure.Description>
        <FormattedMessage
          id="profile.chart.keyFrequencyHistogram.description"
          description="Message text."
          defaultMessage="This chart shows relative key frequencies."
        />
      </Figure.Description>

      <ChartWrapper>
        <KeyFrequencyHistogram
          keyStatsMap={keyStatsMap}
          width="100%"
          height="28rem"
        />
      </ChartWrapper>

      <Figure.Legend>
        <FormattedMessage
          id="profile.chart.keyFrequencyHistogram.legend"
          description="Message text."
          defaultMessage="Bar color: {label1} – hit count, {label2} – miss count, {label3} – miss/hit ratio (relative miss frequency)."
          values={{
            label1: <Marker type="histogram-h" />,
            label2: <Marker type="histogram-m" />,
            label3: <Marker type="histogram-r" />,
          }}
        />
      </Figure.Legend>
    </Figure>
  );
}
