#ifndef HTTP_H
#define HTTP_H

const int HTTP_GET    = 0;
const int HTTP_HEAD   = 1;
const int HTTP_PUT    = 2;
const int HTTP_POST   = 3;
const int HTTP_DELETE = 4;

// Information
const int   HTTP_CONTINUE         = 100;
const char *HTTP_CONTINUE_M       = "Continue";
const int   HTTP_SWITCH           = 101;
const char *HTTP_SWITCH_M         = "Switching Protocols";
const int   HTTP_CHECKPOINT       = 103;
const char *HTTP_CHECKPOINT_M     = "Checkpoint";

// Successful
const int   HTTP_OK               = 200;
const char *HTTP_OK_M             = "OK";
const int   HTTP_CREATED          = 201;
const char *HTTP_CREATED_M        = "Created";
const int   HTTP_ACCEPTED         = 202;
const char *HTTP_ACCEPTED_M       = "Accepted";
const int   HTTP_NAI              = 203;
const char *HTTP_NAI_M            = "Non-Authoritative Information";
const int   HTTP_NOCONTENT        = 204;
const char *HTTP_NOCONTENT_M      = "No Content";
const int   HTTP_RESET            = 205;
const char *HTTP_RESET_M          = "Reset Content";
const int   HTTP_PARTIAL          = 206;
const char *HTTP_PARTICAL_M       = "Partial Content";

// Redirection
const int   HTTP_MULTIPLE         = 300;
const char *HTTP_MULTIPLE_M       = "Multiple Choices";
const int   HTTP_MOVED            = 301;
const char *HTTP_MOVED_M          = "Moved Permanently";
const int   HTTP_FOUND            = 302;
const char *HTTP_FOUND_M          = "Found";
const int   HTTP_SEEOTHER         = 303;
const char *HTTP_SEEOTHER_M       = "See Other";
const int   HTTP_NOTMODIFIED      = 304;
const char *HTTP_NOTMODIFIED_M    = "Not Modified";
const int   HTTP_SWITCHPROXY      = 306;
const char *HTTP_SWITCHPROXY_M    = "Switch Proxy";
const int   HTTP_REDIRECT         = 307;
const char *HTTP_REDIRECT_M       = "Temporary Redirect";
const int   HTTP_RESUME           = 308;
const char *HTTP_RESUME_M         = "Resumme Incomplete";

// Client Error
const int   HTTP_BADREQUEST       = 400;
const char *HTTP_BADREQUEST_M     = "Bad Request";
const int   HTTP_UNAUTHORIZED     = 401;
const char *HTTP_UNAUTHORIZED_M   = "Unauthorized";
const int   HTTP_PAYMENT          = 402;
const char *HTTP_PAYMENT_M        = "Payment Required";
const int   HTTP_FORBIDDEN        = 403;
const char *HTTP_FORBIDDEN_M      = "Forbidden";
const int   HTTP_NOTFOUND         = 404;
const char *HTTP_NOTFOUND_M       = "Not Found";
const int   HTTP_NOTALLOWED       = 405;
const char *HTTP_NOTALLOWED_M     = "Method Not Allowed";
const int   HTTP_NOTACCEPTABLE    = 406;
const char *HTTP_NOTACCEPTABLE_M  = "Not Acceptable";
const int   HTTP_AUTHENTICATION   = 407;
const char *HTTP_AUTHENTICATION_M = "Proxy Authentication Required";
const int   HTTP_RTIMEOUT         = 408;
const char *HTTP_RTIMEOUT_M       = "Request Timeout";
const int   HTTP_CONFLICT         = 409;
const char *HTTP_CONFLICT_M       = "Conflict";
const int   HTTP_GONE             = 410;
const char *HTTP_GONE_M           = "Gone";
const int   HTTP_LENGTH           = 411;
const char *HTTP_LENGTH_M         = "Length Required";
const int   HTTP_PRECONDITION     = 412;
const char *HTTP_PRECONDITION_M   = "Precondition Failed";
const int   HTTP_TOOLARGE         = 413;
const char *HTTP_TOOLARGE_M       = "Request Entity Too Large";
const int   HTTP_TOOLONG          = 414;
const char *HTTP_TOOLONG_M        = "Request-URI Too Long";
const int   HTTP_UNSUPPORTED      = 415;
const char *HTTP_UNSUPPORTED_M    = "Unsupported Media Type";
const int   HTTP_UNSAT            = 416;
const char *HTTP_UNSAT_M          = "Request Range Not Satisfiable";
const int   HTTP_FAILED           = 417;
const char *HTTP_FAILED_M         = "Expectation Failed";

// Server Error
const int   HTTP_INTERNAL         = 500;
const char *HTTP_INTERNAL_M       = "Internal Server Error";
const int   HTTP_NOTIMPLEMENTED   = 501;
const char *HTTP_NOTIMPLEMENTED_M = "Not Implemented";
const int   HTTP_BADGATEWAY       = 502;
const char *HTTP_BADGATEWAY_M     = "Found";
const int   HTTP_UNAVAILABLE      = 503;
const char *HTTP_UNAVAILABLE_M    = "Service Unavailable";
const int   HTTP_GTIMEOUT         = 504;
const char *HTTP_GTIMEOUT_M       = "Gateway Timeout";
const int   HTTP_VERSION          = 505;
const char *HTTP_VERSION_M        = "HTTP Version Not Supported";
const int   HTTP_NETAUTHREQ       = 511;
const char *HTTP_NETAUTHREQ_M     = "Network Authentication Required";


typedef struct http_request {
  int   method;
  char  file[512];
  char  version[32];
  char  header[1024];
  char *body;
} HttpRequest;

typedef struct http_response {
  char  version[32];
  int   status;
  char  message[128];
  char  header[1024];
  char *body;
} HttpResponse;

void httpreqstr(HttpRequest*, char*);
void httprespstr(HttpResponse*, char*);
void buildhttpreq(HttpRequest*, char*);
void buildhttpresp(HttpResponse*, char*);
HttpRequest  *httpreqfromstr(char*);
HttpResponse *httprespformstr(char*);

#endif