"""
セッション管理API共通レスポンスモデル
backend_server.pyとcloud_functions/agent_engine_stream/main.pyで共有
"""

from typing import Any

from pydantic import BaseModel


class ApiResponse(BaseModel):
    """汎用APIレスポンス"""

    success: bool
    data: Any | None = None
    error: str | None = None


class VertexAIBlob(BaseModel):
    """Vertex AI Content APIのBlobオブジェクト"""

    mimeType: str
    data: str  # base64-encoded string
    displayName: str | None = None


class VertexAIFileData(BaseModel):
    """Vertex AI Content APIのFileDataオブジェクト"""

    mimeType: str
    fileUri: str
    displayName: str | None = None


class VertexAIFunctionCall(BaseModel):
    """Vertex AI Content APIのFunctionCallオブジェクト"""

    id: str | None = None
    name: str
    args: dict[str, Any] | None = None


class VertexAIFunctionResponse(BaseModel):
    """Vertex AI Content APIのFunctionResponseオブジェクト"""

    id: str | None = None
    name: str
    response: dict[str, Any]


class VertexAIExecutableCode(BaseModel):
    """Vertex AI Content APIのExecutableCodeオブジェクト"""

    language: str  # enum: LANGUAGE_UNSPECIFIED, PYTHON
    code: str


class VertexAICodeExecutionResult(BaseModel):
    """Vertex AI Content APIのCodeExecutionResultオブジェクト"""

    outcome: str  # enum: OUTCOME_UNSPECIFIED, OUTCOME_OK, OUTCOME_FAILED, OUTCOME_DEADLINE_EXCEEDED
    output: str | None = None


class VertexAIVideoMetadata(BaseModel):
    """Vertex AI Content APIのVideoMetadataオブジェクト"""

    startOffset: str | None = None  # Duration format
    endOffset: str | None = None  # Duration format


class VertexAIPart(BaseModel):
    """Vertex AI Content APIのPartオブジェクト"""

    thought: bool | None = None
    thoughtSignature: str | None = None  # base64-encoded string
    # data Union type - only one of these should be set
    text: str | None = None
    inlineData: VertexAIBlob | None = None
    fileData: VertexAIFileData | None = None
    functionCall: VertexAIFunctionCall | None = None
    functionResponse: VertexAIFunctionResponse | None = None
    executableCode: VertexAIExecutableCode | None = None
    codeExecutionResult: VertexAICodeExecutionResult | None = None
    # metadata Union type - only one of these should be set
    videoMetadata: VertexAIVideoMetadata | None = None


class VertexAIContent(BaseModel):
    """Vertex AI Content APIのContentオブジェクト"""

    role: str | None = None  # 'user' or 'model'
    parts: list[VertexAIPart] = []


class VertexAISession(BaseModel):
    """Vertex AI Sessions APIのSessionオブジェクト"""

    name: str
    createTime: str
    updateTime: str
    userId: str
    displayName: str | None = None
    sessionState: dict[str, Any] | None = None


class VertexAIEventActions(BaseModel):
    """Vertex AI Sessions APIのEventActionsオブジェクト"""

    skipSummarization: bool | None = None
    stateDelta: dict[str, Any] | None = None
    artifactDelta: dict[str, int] | None = None
    transferToAgent: bool | None = None  # deprecated
    escalate: bool | None = None
    requestedAuthConfigs: dict[str, Any] | None = None
    transferAgent: str | None = None


class VertexAIEventMetadata(BaseModel):
    """Vertex AI Sessions APIのEventMetadataオブジェクト"""

    groundingMetadata: dict[str, Any] | None = None
    partial: bool | None = None
    turnComplete: bool | None = None
    interrupted: bool | None = None
    longRunningToolIds: list[str] | None = None
    branch: str | None = None


class VertexAISessionEvent(BaseModel):
    """Vertex AI Sessions APIのSessionEventオブジェクト"""

    name: str
    author: str
    invocationId: str
    timestamp: str
    content: VertexAIContent | None = None  # Content object
    actions: VertexAIEventActions | None = None
    errorCode: str | None = None
    errorMessage: str | None = None
    eventMetadata: VertexAIEventMetadata | None = None


class SessionCreateResponse(BaseModel):
    """セッション作成応答"""

    success: bool
    # セッションIDのみを返す（例: "8524753893437997056"）
    sessionId: str | None = None
    error: str | None = None


class SessionGetResponse(BaseModel):
    """セッション取得応答"""

    success: bool
    # 統一してVertexAISession型を使用（backend_server側で変換）
    session: VertexAISession | None = None
    error: str | None = None


class VertexAIEventsListResponse(BaseModel):
    """Vertex AI Sessions APIの/eventsエンドポイントレスポンス"""

    sessionEvents: list[VertexAISessionEvent] = []
    nextPageToken: str | None = None


class VertexAISessionsListResponse(BaseModel):
    """Vertex AI Sessions APIの/listエンドポイントレスポンス"""

    sessions: list[VertexAISession] = []
    nextPageToken: str | None = None


class SessionListResponse(BaseModel):
    """セッション一覧応答"""

    success: bool
    # 統一してVertexAISession型を使用（backend_server側で変換）
    sessions: list[VertexAISession] | None = None
    nextPageToken: str | None = None
    error: str | None = None


class SessionEventListResponse(BaseModel):
    """セッションイベント一覧応答"""

    success: bool
    # 統一してVertexAISessionEvent型を使用（backend_server側で変換）
    events: list[VertexAISessionEvent] | None = None
    nextPageToken: str | None = None
    error: str | None = None
