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

void LogBuffer::install()
{
    static LogBuffer coutBuffer;
    static LogBuffer cerrBuffer;
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
    std::lock_guard<std::mutex> lock(storeMutex());
    m_forward->sputc(c);
    if (c == '\n')
    {
        commitLine();
    }
    else if (c != '\r')
    {
        m_current += c;
    }
}

void LogBuffer::commitLine()
{
    if (!m_current.empty())
    {
        std::time_t now = std::time(nullptr);
        char stamp[16] = "";
        std::strftime(stamp, sizeof(stamp), "%H:%M:%S", std::localtime(&now));
        store().push_back({nextId()++, stamp, m_current});
        if (store().size() > MAX_LINES)
        {
            store().pop_front();
        }
    }
    m_current.clear();
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
