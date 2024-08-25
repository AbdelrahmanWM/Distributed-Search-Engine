#include <iostream>
#include "WebCrawler.h"
#include "DataBase.h"
#include "HTMLParser.h"
#include "URLParser.h"
#include <queue>
#include "InvertedIndex.h"
#include "BM25Ranker.h"
#include "WordProcessor.h"

static const std::string DATABASE = "SearchEngine";
static const std::string DOCUMENTS_COLLECTION = "pages";
static const std::string VISITED_URLS_COLLECTION = "VisitedUrls";
static const std::string INVERTED_INDEX_COLLECTION = "Index";
static const std::string METADATA_COLLECTION="Metadata";
static const int NUMBER_OF_PAGES = 5;
static const bool USE_PROXY = false;
static const double BM25K1 = 1.5;
static const double BM25B = 0.75;

static std::queue<std::string>seed_urls({
	"http://localhost:3000/doc1",
	"http://localhost:3000/doc2",
	"http://localhost:3000/doc3",
	"http://localhost:3000/doc4",
	"http://localhost:3000/doc5"
	// "https://www.bbc.com",
    // "https://www.cnn.com/",
    // "https://techcrunch.com/",
    // "https://www.wired.com/",
    // "https://www.nytimes.com/",
    // "https://arstechnica.com/",
    // "https://www.khanacademy.org/",
    // "https://www.coursera.org/",
    // "https://news.ycombinator.com/",
    // "https://www.medium.com/"
});

int main(int argc, char*argv[])
{
	
	for(auto ele:WordProcessor::tokenize("very fast"))std::cout<<ele<<',';std::cout<<'\n';
	if (argc < 3) {
		std::cerr << "Usage: " << argv[0] << " <MongoDB connection string>"
			<< std::endl;
		return EXIT_FAILURE;
	}
	const std::string connectionString = argv[1];
	const std::string proxyAPIUrl = argv[2];

	const DataBase* db = DataBase::getInstance(connectionString);
	
	curl_global_init(CURL_GLOBAL_ALL);
	HTMLParser htmlParser{};
	URLParser urlParser{seed_urls.front()};
	WebCrawler webCrawler{ seed_urls ,NUMBER_OF_PAGES,db,htmlParser,urlParser,DATABASE,DOCUMENTS_COLLECTION,VISITED_URLS_COLLECTION,USE_PROXY,proxyAPIUrl};
	webCrawler.run(true);
    
	InvertedIndex invertedIndex{ db,DATABASE,INVERTED_INDEX_COLLECTION, DOCUMENTS_COLLECTION, METADATA_COLLECTION};
	invertedIndex.run(true);
    
	BM25Ranker bm25Ranker{DATABASE,DOCUMENTS_COLLECTION,invertedIndex,BM25K1,BM25B};
	std::vector<std::pair<std::string,double>> documents = bm25Ranker.run("\"very fast\"");
	for(const auto&pair:documents){
		std::cout<<"Document: "<<pair.first<<" -> "<<pair.second<<'\n';
	}
	curl_global_cleanup();
}
//CURL* curl;
//CURLcode res;
//std::string response;
//
//curl_global_init(CURL_GLOBAL_ALL);
//
//curl = curl_easy_init();
//if (curl) {
//    curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:3000/api/users");
//    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
//    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
//    res = curl_easy_perform(curl);
//
//    if (res != CURLE_OK) {
//        std::cerr << "Failed to perform HTTP request: " << curl_easy_strerror(res) << std::endl;
//    }
//    else {
//        std::cout << "Response:\n" << response << std::endl;
//    }
//    curl_easy_cleanup(curl);
//}
///// my code
//
//curl_global_cleanup();