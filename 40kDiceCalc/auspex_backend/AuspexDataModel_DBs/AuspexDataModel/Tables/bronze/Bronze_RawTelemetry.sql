-- bronze layer table for raw json payloads
create table [dbo].[bronze_rawtelemetry] (
    [telemetryid] uniqueidentifier default newsequentialid() primary key,
    [batchid] varchar(50) not null,
    [receivedat] datetime2 default sysutcdatetime(),
    [jsonpayload] nvarchar(max) not null
);