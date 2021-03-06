import * as api from './models';
import * as ls from './types';
import { hexToDec } from './utils';
import { ReadableSpan } from '@opentelemetry/tracing';
import {
  hrTimeToMilliseconds,
  hrTimeToMicroseconds,
} from '@opentelemetry/core';
import { HrTime, Link, SpanContext, TimedEvent } from '@opentelemetry/api';

function toSpan(span: ReadableSpan): ls.Span {
  return new api.Span({
    operationName: span.name,
    startTimestamp: hrTimeToDate(span.startTime),
    durationMicros: hrTimeToMicroseconds(span.duration).toString(),
    spanContext: getSpanContext(span),
    references: getReferences(span),
    logs: getLogs(span),
    tags: getTags(span),
  });
}

function NewSpanContext(traceId: string, spanId: string): ls.SpanContext {
  return new api.SpanContext({
    traceId: hexToDec(traceId.slice(16)),
    spanId: hexToDec(spanId),
  });
}

function getSpanContext(span: ReadableSpan): ls.SpanContext {
  const context = span.spanContext;
  return NewSpanContext(context.traceId, context.spanId);
}

function getReferences(span: ReadableSpan): ls.Reference[] {
  const references: ls.Reference[] = [];
  const context: SpanContext = span.spanContext;

  // reference - parent
  if (typeof span.parentSpanId !== 'undefined') {
    const ref: ls.Reference = new api.Reference({
      relationship: api.Relationship.CHILD_OF,
      spanContext: NewSpanContext(context.traceId, span.parentSpanId),
    });

    references.push(ref);
  }

  // reference links
  span.links.forEach((link: Link) => {
    const linkContext = link.context;

    const ref = new api.Reference({
      relationship: getRelationshipForLink(link, span),
      spanContext: NewSpanContext(linkContext.traceId, linkContext.spanId),
    });

    references.push(ref);
  });

  return references;
}

function getRelationshipForLink(
  link: Link,
  span: ReadableSpan
): ls.Relationship {
  if (link.context.spanId === span.parentSpanId) {
    return api.Relationship.CHILD_OF;
  } else {
    return api.Relationship.FOLLOWS_FROM;
  }
}

function getLogs(span: ReadableSpan): ls.Log[] {
  return span.events.map((ev: TimedEvent) => {
    const fields: ls.KeyValue[] = mapToKeyValueArray(ev.attributes || {});
    fields.push(new api.KeyValue({ key: 'event', value: ev.name }));

    return new api.Log({
      timestamp: hrTimeToDate(ev.time),
      fields,
    });
  });
}

function getTags(span: ReadableSpan): ls.KeyValue[] {
  return mapToKeyValueArray(span.attributes);
}

function hrTimeToDate(hrTime: HrTime): Date {
  return new Date(hrTimeToMilliseconds(hrTime));
}

function mapToKeyValueArray(map: { [key: string]: any }): ls.KeyValue[] {
  return Object.keys(map).map(
    (key: string) => new api.KeyValue({ key, value: map[key] })
  );
}

export { mapToKeyValueArray, toSpan };
