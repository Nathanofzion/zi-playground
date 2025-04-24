const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export const handleException = async (
  handler: () => Promise<unknown | undefined>
) => {
  try {
    const response = await handler();
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    if (err instanceof Exception) {
      return new Response(JSON.stringify({ message: err.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: err.statusCode,
      });
    }
    return new Response(
      JSON.stringify({ message: err instanceof Error ? err.message : err }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

// Base Exception class
export class Exception extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "Exception";
  }
}

// Not Found Exception
export class NotFoundException extends Exception {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundException";
  }
}

// Bad Request Exception
export class BadRequestException extends Exception {
  constructor(message: string = "Bad request") {
    super(message, 400);
    this.name = "BadRequestException";
  }
}

// Unauthorized Exception
export class UnauthorizedException extends Exception {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
    this.name = "UnauthorizedException";
  }
}

// Forbidden Exception
export class ForbiddenException extends Exception {
  constructor(message: string = "Access denied") {
    super(message, 403);
    this.name = "ForbiddenException";
  }
}

// Conflict Exception
export class ConflictException extends Exception {
  constructor(message: string = "Conflict occurred") {
    super(message, 409);
    this.name = "ConflictException";
  }
}

// Unprocessable Entity Exception
export class UnprocessableEntityException extends Exception {
  constructor(message: string = "Unprocessable Entity") {
    super(message, 422);
    this.name = "UnprocessableEntityException";
  }
}

// Method Not Allowed Exception
export class MethodNotAllowedException extends Exception {
  constructor(message: string = "Method not allowed") {
    super(message, 405);
    this.name = "MethodNotAllowedException";
  }
}

// Not Acceptable Exception
export class NotAcceptableException extends Exception {
  constructor(message: string = "Not acceptable") {
    super(message, 406);
    this.name = "NotAcceptableException";
  }
}
