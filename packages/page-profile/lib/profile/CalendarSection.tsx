import { type ResultSummary } from "@keybr/result";
import { Figure } from "@keybr/widget";
import { type ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Calendar } from "./Calendar.tsx";

export function CalendarSection({
  summary,
}: {
  readonly summary: ResultSummary;
}): ReactNode {
  return (
    <Figure>
      <Figure.Caption>
        <FormattedMessage
          id="profile.chart.calendar.caption"
          description="Header text."
          defaultMessage="Practice Calendar"
        />
      </Figure.Caption>

      <Figure.Description>
        <FormattedMessage
          id="profile.chart.calendar.description"
          description="Message text."
          defaultMessage="This calendar shows the dates of active learning."
        />
      </Figure.Description>

      <Calendar summary={summary} />
    </Figure>
  );
}
