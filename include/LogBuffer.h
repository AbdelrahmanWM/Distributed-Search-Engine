#ifndef LOGBUFFER_H
#define LOGBUFFER_H
#include <deque>
#include <mutex>
#include <streambuf>
#include <string>
#include <vector>

struct LogLine
{
    long id;
    std::string time;
    std::string text;
};

// Tees std::cout and std::cerr to the console while keeping the last MAX_LINES
// lines in a shared in-memory store so the server can expose them via GET /logs.
class LogBuffer : public std::streambuf
{
public:
    static void install();
    static std::vector<LogLine> linesAfter(long afterId);

protected:
    int overflow(int ch) override;
    std::streamsize xsputn(const char *s, std::streamsize n) override;
    int sync() override;

private:
    LogBuffer() = default;
    void put(char c);
    void commitLine(); // caller must hold storeMutex()

    static std::mutex &storeMutex();
    static std::deque<LogLine> &store();
    static long &nextId();

    std::streambuf *m_forward = nullptr;
    std::string m_current;
    static const size_t MAX_LINES = 500;
};

#endif
