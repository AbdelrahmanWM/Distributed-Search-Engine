#include "LogBuffer.h"
#include <ctime>
#include <iostream>

std::mutex &LogBuffer::storeMutex()
{
    static std::mutex mutex;
    return mutex;
}

std::deque<LogLine> &LogBuffer::store()
{
    static std::deque<LogLine> lines;
    return lines;
}

long &LogBuffer::nextId()
{
    static long id = 1;
    return id;
}

std::string &LogBuffer::currentLine()
{
    static thread_local std::string lines[2];
    return lines[m_slot];
}

void LogBuffer::install()
{
    static LogBuffer coutBuffer{0};
    static LogBuffer cerrBuffer{1};
    if (coutBuffer.m_forward == nullptr)
    {
        coutBuffer.m_forward = std::cout.rdbuf(&coutBuffer);
    }
    if (cerrBuffer.m_forward == nullptr)
    {
        cerrBuffer.m_forward = std::cerr.rdbuf(&cerrBuffer);
    }
}

int LogBuffer::overflow(int ch)
{
    if (ch == EOF)
    {
        return 0;
    }
    put(static_cast<char>(ch));
    return ch;
}

std::streamsize LogBuffer::xsputn(const char *s, std::streamsize n)
{
    for (std::streamsize i = 0; i < n; i++)
    {
        put(s[i]);
    }
    return n;
}

int LogBuffer::sync()
{
    std::lock_guard<std::mutex> lock(storeMutex());
    return m_forward->pubsync();
}

void LogBuffer::put(char c)
{
    std::string &line = currentLine();
    if (c == '\n')
    {
        std::lock_guard<std::mutex> lock(storeMutex());
        line += c;
        m_forward->sputn(line.c_str(), line.size());
        line.pop_back();
        commitLine(line);
    }
    else if (c != '\r')
    {
        line += c;
    }
}

void LogBuffer::commitLine(std::string &line)
{
    if (!line.empty())
    {
        std::time_t now = std::time(nullptr);
        char stamp[16] = "";
        std::strftime(stamp, sizeof(stamp), "%H:%M:%S", std::localtime(&now));
        store().push_back({nextId()++, stamp, line});
        if (store().size() > MAX_LINES)
        {
            store().pop_front();
        }
    }
    line.clear();
}

std::vector<LogLine> LogBuffer::linesAfter(long afterId)
{
    std::lock_guard<std::mutex> lock(storeMutex());
    std::vector<LogLine> result;
    for (const LogLine &line : store())
    {
        if (line.id > afterId)
        {
            result.push_back(line);
        }
    }
    return result;
}
