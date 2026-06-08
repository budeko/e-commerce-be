import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthError, AuthService } from "./auth.service.js";
import {
  type LoginBody,
  type RegisterBody,
  validateRegisterBusinessRules,
} from "./auth.schema.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const validationError = validateRegisterBusinessRules(request.body);
      if (validationError) {
        reply.status(400).send({
          error: "Bad Request",
          message: validationError,
        });
        return;
      }

      const result = await this.authService.register(request.body);

      reply.status(201).send({
        message: "Registration successful",
        user: result.user,
        profile: result.profile,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  login = async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { email, password } = request.body;
      const result = await this.authService.login(email, password);

      reply.status(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const result = await this.authService.getMe(request.user);

      reply.status(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof AuthError) {
      reply.status(error.statusCode).send({
        error: this.statusText(error.statusCode),
        message: error.message,
      });
      return;
    }

    reply.log.error(error);
    reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    });
  }

  private statusText(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return "Bad Request";
      case 401:
        return "Unauthorized";
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 409:
        return "Conflict";
      default:
        return "Error";
    }
  }
}

export function createAuthController(_fastify: FastifyInstance): AuthController {
  const authService = new AuthService();
  return new AuthController(authService);
}
