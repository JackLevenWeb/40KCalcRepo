-- bronze layer table for raw json payloads
CREATE TABLE [dbo].[bronze_rawtelemetry] (
    [telemetryid] uniqueidentifier DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [batchid] varchar(50) NOT NULL,
    [receivedat] datetime2 DEFAULT SYSUTCDATETIME(),
    [jsonpayload] nvarchar(max) NOT NULL
);