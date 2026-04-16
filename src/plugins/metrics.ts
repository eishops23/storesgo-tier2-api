// =============================================================================
// 📊 PROMETHEUS METRICS PLUGIN — STORESGO BACKEND
// Exposes application metrics for Prometheus scraping
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import * as os from "os";

// =============================================================================
// Simple In-Memory Metrics Registry (no external dependencies)
// =============================================================================

interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp?: number;
}

interface Histogram {
  buckets: number[];
  counts: Map<string, number[]>;
  sums: Map<string, number>;
  totalCounts: Map<string, number>;
}

class MetricsRegistry {
  private counters: Map<string, Map<string, number>> = new Map();
  private gauges: Map<string, Map<string, number>> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private metricHelp: Map<string, string> = new Map();
  private metricType: Map<string, string> = new Map();

  constructor() {
    // Initialize default histograms for HTTP requests
    this.createHistogram(
      "storesgo_http_request_duration_seconds",
      "HTTP request duration in seconds",
      [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    );
  }

  private labelsToKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }

  // Counter methods
  incCounter(name: string, labels: Record<string, string> = {}, value: number = 1) {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }
    const key = this.labelsToKey(labels);
    const current = this.counters.get(name)!.get(key) || 0;
    this.counters.get(name)!.set(key, current + value);
  }

  // Gauge methods
  setGauge(name: string, labels: Record<string, string> = {}, value: number) {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }
    const key = this.labelsToKey(labels);
    this.gauges.get(name)!.set(key, value);
  }

  incGauge(name: string, labels: Record<string, string> = {}, value: number = 1) {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }
    const key = this.labelsToKey(labels);
    const current = this.gauges.get(name)!.get(key) || 0;
    this.gauges.get(name)!.set(key, current + value);
  }

  decGauge(name: string, labels: Record<string, string> = {}, value: number = 1) {
    this.incGauge(name, labels, -value);
  }

  // Histogram methods
  createHistogram(name: string, help: string, buckets: number[]) {
    this.histograms.set(name, {
      buckets: [...buckets, Infinity],
      counts: new Map(),
      sums: new Map(),
      totalCounts: new Map(),
    });
    this.metricHelp.set(name, help);
    this.metricType.set(name, "histogram");
  }

  observeHistogram(name: string, labels: Record<string, string> = {}, value: number) {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    const key = this.labelsToKey(labels);
    
    // Initialize if needed
    if (!histogram.counts.has(key)) {
      histogram.counts.set(key, new Array(histogram.buckets.length).fill(0));
      histogram.sums.set(key, 0);
      histogram.totalCounts.set(key, 0);
    }

    // Update bucket counts
    const counts = histogram.counts.get(key)!;
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        counts[i]++;
      }
    }

    // Update sum and count
    histogram.sums.set(key, (histogram.sums.get(key) || 0) + value);
    histogram.totalCounts.set(key, (histogram.totalCounts.get(key) || 0) + 1);
  }

  // Register metric metadata
  registerMetric(name: string, type: "counter" | "gauge" | "histogram", help: string) {
    this.metricHelp.set(name, help);
    this.metricType.set(name, type);
  }

  // Export metrics in Prometheus format
  export(): string {
    const lines: string[] = [];

    // Export counters
    this.counters.forEach((values, name) => {
      if (this.metricHelp.has(name)) {
        lines.push(`# HELP ${name} ${this.metricHelp.get(name)}`);
      }
      lines.push(`# TYPE ${name} counter`);
      values.forEach((value, labels) => {
        const labelStr = labels ? `{${labels}}` : "";
        lines.push(`${name}${labelStr} ${value}`);
      });
    });

    // Export gauges
    this.gauges.forEach((values, name) => {
      if (this.metricHelp.has(name)) {
        lines.push(`# HELP ${name} ${this.metricHelp.get(name)}`);
      }
      lines.push(`# TYPE ${name} gauge`);
      values.forEach((value, labels) => {
        const labelStr = labels ? `{${labels}}` : "";
        lines.push(`${name}${labelStr} ${value}`);
      });
    });

    // Export histograms
    this.histograms.forEach((histogram, name) => {
      if (this.metricHelp.has(name)) {
        lines.push(`# HELP ${name} ${this.metricHelp.get(name)}`);
      }
      lines.push(`# TYPE ${name} histogram`);
      
      histogram.counts.forEach((counts, labelsKey) => {
        const baseLabels = labelsKey ? labelsKey + "," : "";
        
        // Bucket counts
        for (let i = 0; i < histogram.buckets.length; i++) {
          const le = histogram.buckets[i] === Infinity ? "+Inf" : histogram.buckets[i].toString();
          lines.push(`${name}_bucket{${baseLabels}le="${le}"} ${counts[i]}`);
        }
        
        // Sum and count
        const sum = histogram.sums.get(labelsKey) || 0;
        const count = histogram.totalCounts.get(labelsKey) || 0;
        const labelStr = labelsKey ? `{${labelsKey}}` : "";
        lines.push(`${name}_sum${labelStr} ${sum}`);
        lines.push(`${name}_count${labelStr} ${count}`);
      });
    });

    return lines.join("\n");
  }
}

// =============================================================================
// Global Metrics Registry
// =============================================================================
const metricsRegistry = new MetricsRegistry();

// Register common metrics
metricsRegistry.registerMetric("storesgo_http_requests_total", "counter", "Total HTTP requests");
metricsRegistry.registerMetric("storesgo_http_request_errors_total", "counter", "Total HTTP request errors");
metricsRegistry.registerMetric("storesgo_active_connections", "gauge", "Number of active connections");
metricsRegistry.registerMetric("storesgo_health_check_status", "gauge", "Health check status (1=healthy, 0=unhealthy)");
metricsRegistry.registerMetric("storesgo_queue_waiting_jobs", "gauge", "Number of jobs waiting in queue");
metricsRegistry.registerMetric("storesgo_queue_active_jobs", "gauge", "Number of active jobs");
metricsRegistry.registerMetric("storesgo_queue_completed_jobs_total", "counter", "Total completed jobs");
metricsRegistry.registerMetric("storesgo_queue_failed_jobs_total", "counter", "Total failed jobs");
metricsRegistry.registerMetric("storesgo_db_query_duration_seconds", "histogram", "Database query duration in seconds");

// =============================================================================
// Metrics Plugin
// =============================================================================
interface MetricsPluginOptions {
  enabled?: boolean;
  path?: string;
  collectSystemMetrics?: boolean;
}

const metricsPlugin: FastifyPluginAsync<MetricsPluginOptions> = async (
  app: FastifyInstance,
  options: MetricsPluginOptions
) => {
  const enabled = options.enabled !== false && process.env.METRICS_ENABLED !== "false";
  const metricsPath = options.path || "/api/metrics";
  const collectSystem = options.collectSystemMetrics !== false;

  if (!enabled) {
    app.log.info("📊 Metrics collection disabled");
    return;
  }

  // Decorate app with metrics registry
  app.decorate("metrics", {
    registry: metricsRegistry,
    incCounter: metricsRegistry.incCounter.bind(metricsRegistry),
    setGauge: metricsRegistry.setGauge.bind(metricsRegistry),
    incGauge: metricsRegistry.incGauge.bind(metricsRegistry),
    decGauge: metricsRegistry.decGauge.bind(metricsRegistry),
    observeHistogram: metricsRegistry.observeHistogram.bind(metricsRegistry),
    observeDbQuery: (duration: number, operation: string) => {
      metricsRegistry.observeHistogram("storesgo_db_query_duration_seconds", { operation }, duration);
    },
  });

  // Track active connections
  let activeConnections = 0;

  app.addHook("onRequest", async (request: FastifyRequest) => {
    activeConnections++;
    metricsRegistry.setGauge("storesgo_active_connections", {}, activeConnections);
    
    // Store request start time
    (request as any).metricsStartTime = process.hrtime.bigint();
  });

  app.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
    activeConnections--;
    metricsRegistry.setGauge("storesgo_active_connections", {}, activeConnections);

    // Calculate request duration
    const startTime = (request as any).metricsStartTime;
    if (startTime) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1e9; // Convert to seconds
      
      const labels = {
        method: request.method,
        route: request.routeOptions?.url || request.url.split("?")[0],
        status: reply.statusCode.toString(),
      };

      // Record request count
      metricsRegistry.incCounter("storesgo_http_requests_total", labels);
      
      // Record duration histogram
      metricsRegistry.observeHistogram("storesgo_http_request_duration_seconds", labels, duration);
      
      // Record errors
      if (reply.statusCode >= 400) {
        metricsRegistry.incCounter("storesgo_http_request_errors_total", labels);
      }
    }
  });

  // Collect system metrics periodically
  if (collectSystem) {
    const collectSystemMetrics = () => {
      const mem = process.memoryUsage();
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      // Memory metrics
      metricsRegistry.setGauge("storesgo_nodejs_heap_size_bytes", {}, mem.heapTotal);
      metricsRegistry.setGauge("storesgo_nodejs_heap_used_bytes", {}, mem.heapUsed);
      metricsRegistry.setGauge("storesgo_nodejs_external_bytes", {}, mem.external);
      metricsRegistry.setGauge("storesgo_nodejs_rss_bytes", {}, mem.rss);

      // CPU metrics
      metricsRegistry.setGauge("storesgo_nodejs_cpu_count", {}, cpus.length);
      metricsRegistry.setGauge("storesgo_system_load_1m", {}, loadAvg[0]);
      metricsRegistry.setGauge("storesgo_system_load_5m", {}, loadAvg[1]);
      metricsRegistry.setGauge("storesgo_system_load_15m", {}, loadAvg[2]);

      // Uptime
      metricsRegistry.setGauge("storesgo_nodejs_uptime_seconds", {}, process.uptime());

      // Event loop lag (simple approximation)
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6; // ms
        metricsRegistry.setGauge("storesgo_nodejs_eventloop_lag_ms", {}, lag);
      });
    };

    // Collect immediately and then every 15 seconds
    collectSystemMetrics();
    const interval = setInterval(collectSystemMetrics, 15000);

    app.addHook("onClose", async () => {
      clearInterval(interval);
    });
  }

  // Metrics endpoint
  app.get(metricsPath, async (request, reply) => {
    reply.header("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    return metricsRegistry.export();
  });

  app.log.info(`📊 Metrics plugin initialized → ${metricsPath}`);
};

// =============================================================================
// Type Declarations
// =============================================================================
declare module "fastify" {
  interface FastifyInstance {
    metrics: {
      registry: MetricsRegistry;
      incCounter: (name: string, labels?: Record<string, string>, value?: number) => void;
      setGauge: (name: string, labels: Record<string, string>, value: number) => void;
      incGauge: (name: string, labels?: Record<string, string>, value?: number) => void;
      decGauge: (name: string, labels?: Record<string, string>, value?: number) => void;
      observeHistogram: (name: string, labels: Record<string, string>, value: number) => void;
      observeDbQuery: (duration: number, operation: string) => void;
    };
  }
}

export default fp(metricsPlugin, {
  name: "metrics",
  fastify: "5.x",
});

export { metricsRegistry };

