/**
 * CloudWatch Alarms for Strands Agent Performance Monitoring
 * 
 * Task 11.2: Create CloudWatch alarms for performance degradation
 * Requirements: 7.5
 */
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Duration } from 'aws-cdk-lib';

export interface StrandsAgentAlarmsProps {
  /**
   * Email address to send alarm notifications to (optional)
   */
  alarmEmail?: string;
  
  /**
   * Whether to create the alarms (default: true)
   */
  enabled?: boolean;
}

/**
 * CloudWatch Alarms for Strands Agent Performance
 * 
 * Creates alarms for:
 * - Cold start duration > 10 minutes (600 seconds)
 * - Warm start duration > 60 seconds
 * - Memory usage > 2867 MB (95% of 3GB)
 * - Timeout rate > 10%
 */
export class StrandsAgentAlarms extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly coldStartAlarm: cloudwatch.Alarm;
  public readonly warmStartAlarm: cloudwatch.Alarm;
  public readonly memoryAlarm: cloudwatch.Alarm;
  public readonly timeoutRateAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: StrandsAgentAlarmsProps = {}) {
    super(scope, id);

    const enabled = props.enabled !== false;

    if (!enabled) {
      console.log('Strands Agent alarms disabled');
      return;
    }

    // Create SNS topic for alarm notifications
    this.alarmTopic = new sns.Topic(this, 'StrandsAgentAlarmTopic', {
      displayName: 'Strands Agent Performance Alarms',
      topicName: 'strands-agent-performance-alarms',
    });

    // Subscribe email if provided
    if (props.alarmEmail) {
      this.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alarmEmail)
      );
    }

    // Alarm 1: Cold Start Duration > 10 minutes (600 seconds)
    this.coldStartAlarm = new cloudwatch.Alarm(this, 'ColdStartDurationAlarm', {
      alarmName: 'StrandsAgent-ColdStartDuration-High',
      alarmDescription: 'Strands Agent cold start duration exceeds 10 minutes',
      metric: new cloudwatch.Metric({
        namespace: 'StrandsAgent/Performance',
        metricName: 'ColdStartDuration',
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 600, // 10 minutes in seconds
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.coldStartAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }),
    });

    // Alarm 2: Warm Start Duration > 60 seconds
    this.warmStartAlarm = new cloudwatch.Alarm(this, 'WarmStartDurationAlarm', {
      alarmName: 'StrandsAgent-WarmStartDuration-High',
      alarmDescription: 'Strands Agent warm start duration exceeds 60 seconds',
      metric: new cloudwatch.Metric({
        namespace: 'StrandsAgent/Performance',
        metricName: 'WarmStartDuration',
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 60, // 60 seconds
      evaluationPeriods: 2, // 2 consecutive periods to avoid false alarms
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.warmStartAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }),
    });

    // Alarm 3: Memory Usage > 2867 MB (95% of 3GB = 3008 MB)
    this.memoryAlarm = new cloudwatch.Alarm(this, 'MemoryUsageAlarm', {
      alarmName: 'StrandsAgent-MemoryUsage-High',
      alarmDescription: 'Strands Agent memory usage exceeds 95% of allocated memory (2867 MB)',
      metric: new cloudwatch.Metric({
        namespace: 'StrandsAgent/Performance',
        metricName: 'MemoryUsed',
        statistic: 'Maximum',
        period: Duration.minutes(5),
      }),
      threshold: 2867, // 95% of 3008 MB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.memoryAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }),
    });

    // Alarm 4: Timeout Rate > 10%
    // Calculate timeout rate as: (TimeoutOccurred / InvocationCount) * 100
    const timeoutMetric = new cloudwatch.Metric({
      namespace: 'StrandsAgent/Performance',
      metricName: 'TimeoutOccurred',
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const invocationMetric = new cloudwatch.Metric({
      namespace: 'StrandsAgent/Performance',
      metricName: 'InvocationCount',
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    // Create math expression for timeout rate percentage
    const timeoutRateExpression = new cloudwatch.MathExpression({
      expression: '(timeouts / invocations) * 100',
      usingMetrics: {
        timeouts: timeoutMetric,
        invocations: invocationMetric,
      },
      period: Duration.minutes(5),
    });

    this.timeoutRateAlarm = new cloudwatch.Alarm(this, 'TimeoutRateAlarm', {
      alarmName: 'StrandsAgent-TimeoutRate-High',
      alarmDescription: 'Strands Agent timeout rate exceeds 10%',
      metric: timeoutRateExpression,
      threshold: 10, // 10%
      evaluationPeriods: 2, // 2 consecutive periods to avoid false alarms
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.timeoutRateAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }),
    });

    // Create a composite alarm dashboard (optional)
    this.createAlarmDashboard();
  }

  /**
   * Create a CloudWatch dashboard showing all alarms and metrics
   */
  private createAlarmDashboard() {
    const dashboard = new cloudwatch.Dashboard(this, 'StrandsAgentDashboard', {
      dashboardName: 'StrandsAgent-Performance-Monitoring',
    });

    // Cold Start Duration widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Cold Start Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'ColdStartDuration',
            statistic: 'Average',
            period: Duration.minutes(5),
          }),
        ],
        leftYAxis: {
          label: 'Seconds',
          showUnits: false,
        },
        width: 12,
      })
    );

    // Warm Start Duration widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Warm Start Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'WarmStartDuration',
            statistic: 'Average',
            period: Duration.minutes(5),
          }),
        ],
        leftYAxis: {
          label: 'Seconds',
          showUnits: false,
        },
        width: 12,
      })
    );

    // Memory Usage widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Memory Usage',
        left: [
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'MemoryUsed',
            statistic: 'Maximum',
            period: Duration.minutes(5),
          }),
        ],
        leftYAxis: {
          label: 'MB',
          showUnits: false,
        },
        width: 12,
      })
    );

    // Timeout Rate widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Timeout Rate',
        left: [
          new cloudwatch.MathExpression({
            expression: '(timeouts / invocations) * 100',
            usingMetrics: {
              timeouts: new cloudwatch.Metric({
                namespace: 'StrandsAgent/Performance',
                metricName: 'TimeoutOccurred',
                statistic: 'Sum',
                period: Duration.minutes(5),
              }),
              invocations: new cloudwatch.Metric({
                namespace: 'StrandsAgent/Performance',
                metricName: 'InvocationCount',
                statistic: 'Sum',
                period: Duration.minutes(5),
              }),
            },
          }),
        ],
        leftYAxis: {
          label: 'Percentage',
          showUnits: false,
        },
        width: 12,
      })
    );

    // Task 10: Dependency Loading Times widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Dependency Loading Times (Cold Start)',
        left: [
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'DependencyLoadTime',
            statistic: 'Average',
            period: Duration.minutes(5),
            dimensionsMap: {
              Dependency: 'boto3',
            },
            label: 'boto3',
          }),
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'DependencyLoadTime',
            statistic: 'Average',
            period: Duration.minutes(5),
            dimensionsMap: {
              Dependency: 'psutil',
            },
            label: 'psutil',
          }),
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'DependencyLoadTime',
            statistic: 'Average',
            period: Duration.minutes(5),
            dimensionsMap: {
              Dependency: 'agents',
            },
            label: 'agents',
          }),
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'DependencyLoadTime',
            statistic: 'Average',
            period: Duration.minutes(5),
            dimensionsMap: {
              Dependency: 'cloudwatch_metrics',
            },
            label: 'cloudwatch_metrics',
          }),
          new cloudwatch.Metric({
            namespace: 'StrandsAgent/Performance',
            metricName: 'DependencyLoadTime',
            statistic: 'Average',
            period: Duration.minutes(5),
            dimensionsMap: {
              Dependency: 'total_imports',
            },
            label: 'total_imports',
          }),
        ],
        leftYAxis: {
          label: 'Seconds',
          showUnits: false,
        },
        width: 24,
        stacked: false,
      })
    );

    // Alarm status widget
    dashboard.addWidgets(
      new cloudwatch.AlarmStatusWidget({
        title: 'Alarm Status',
        alarms: [
          this.coldStartAlarm,
          this.warmStartAlarm,
          this.memoryAlarm,
          this.timeoutRateAlarm,
        ],
        width: 24,
      })
    );
  }
}
