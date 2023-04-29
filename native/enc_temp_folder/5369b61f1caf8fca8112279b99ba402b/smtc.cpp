#pragma once
#include "pch.h"

#include <ppltasks.h>
#include <include/capi/cef_task_capi.h>
#include <include/capi/cef_v8_capi.h>
#include "winrt/Windows.Media.Control.h"
#include "winrt/Windows.Media.Playback.h"
#include <winrt/Windows.ApplicationModel.Core.h>
#include <winrt/Windows.Storage.Streams.h>
#include "winrt/Windows.Foundation.h"
#include "utils.cpp"
#include "InfLink.h"
#include <fstream>

using namespace winrt::Windows::Foundation;

using namespace winrt::Windows::Media::Playback;
using namespace winrt::Windows::Media;
using namespace Control;

using namespace winrt;
using namespace Control;
using namespace Windows::ApplicationModel::Core;

using namespace Windows::Storage::Streams;
BetterNCMNativePlugin::extensions::JSFunction* callback = nullptr;
std::optional<MediaPlayer> mediaPlayer;

bool cover_url_mode = false;

char* set_cover_url_mode(bool enable)
{
	cover_url_mode = enable;
}

char* enableSMTC(void** args)
{
	if (!mediaPlayer.has_value())
	{
		mediaPlayer = MediaPlayer();


		mediaPlayer->SystemMediaTransportControls().ButtonPressed([&](SystemMediaTransportControls sender,
		                                                              SystemMediaTransportControlsButtonPressedEventArgs
		                                                              args)
		{
			auto btn = static_cast<int32_t>(args.Button());
			if (callback)(*callback)(btn);
		});
	}


	const auto commandManager = mediaPlayer->CommandManager();
	commandManager.IsEnabled(false);

	SystemMediaTransportControls smtc = mediaPlayer->SystemMediaTransportControls();

	auto updater = smtc.DisplayUpdater();
	updater.ClearAll();
	updater.Type(MediaPlaybackType::Music);
	auto properties = updater.MusicProperties();

	properties.Title(to_hstring(std::string("Loading")));

	updater.Update();

	return nullptr;
}



char* disableSMTC(void** args)
{
	if (!mediaPlayer.has_value())
		mediaPlayer = MediaPlayer();

	SystemMediaTransportControls smtc = mediaPlayer->SystemMediaTransportControls();

	smtc.IsEnabled(false);

	return nullptr;
}

IAsyncOperation<int> GetRandomAccessStreamFromFile(const std::string& filePath, const std::function<void(IRandomAccessStream)>& callback, const std::function<void()>& failed)
{
	try
	{
		std::ifstream fileStream(filePath, std::ios::binary);


		std::vector<uint8_t> fileData((std::istreambuf_iterator<char>(fileStream)), std::istreambuf_iterator<char>());

		InMemoryRandomAccessStream randomAccessStream;
		auto outputStream = randomAccessStream.GetOutputStreamAt(0);
		DataWriter dataWriter(outputStream);
		dataWriter.WriteBytes(fileData);
		co_await dataWriter.StoreAsync();

		callback(randomAccessStream);
	}
	catch (const std::exception& ex)
	{
		std::wstring message(ex.what(), ex.what() + strlen(ex.what()));
		failed();
	}

	co_return 1;
}

char* updateSMTC(void** args)
{
	if (!mediaPlayer.has_value())
		mediaPlayer = MediaPlayer();

	try
	{
		auto imgurl = std::string(static_cast<char*>(args[3]));
		auto imgurl_online = std::string(static_cast<char*>(args[4]));
		if (imgurl.length() > 0)
		{
			// replace / to \

			std::replace(imgurl.begin(), imgurl.end(), '/', '\\');

			GetRandomAccessStreamFromFile(imgurl, [=](IRandomAccessStream raStream)
				{

					const auto commandManager = mediaPlayer->CommandManager();
					commandManager.IsEnabled(false);

					SystemMediaTransportControls smtc = mediaPlayer->SystemMediaTransportControls();

					smtc.IsEnabled(true);
					smtc.IsPlayEnabled(true);
					smtc.IsPauseEnabled(true);


					auto updater = smtc.DisplayUpdater();
					updater.ClearAll();
					updater.Thumbnail(RandomAccessStreamReference::CreateFromStream(raStream));
					updater.Type(MediaPlaybackType::Music);


					auto properties = updater.MusicProperties();
					properties.Title(to_hstring(std::string(static_cast<char*>(args[0])) + "OKKKK"));
					properties.AlbumTitle(to_hstring(std::string(static_cast<char*>(args[1]))));
					properties.Artist(to_hstring(std::string(static_cast<char*>(args[2]))));
					updater.Update();
				
				},[=]()
				{

					const auto commandManager = mediaPlayer->CommandManager();
					commandManager.IsEnabled(false);

					SystemMediaTransportControls smtc = mediaPlayer->SystemMediaTransportControls();

					smtc.IsEnabled(true);
					smtc.IsPlayEnabled(true);
					smtc.IsPauseEnabled(true);


					auto updater = smtc.DisplayUpdater();
					updater.ClearAll();
					updater.Thumbnail(RandomAccessStreamReference::CreateFromUri(Uri(to_hstring(imgurl_online))));
					updater.Type(MediaPlaybackType::Music);


					auto properties = updater.MusicProperties();
					properties.Title(to_hstring(std::string(static_cast<char*>(args[0]))));
					properties.AlbumTitle(to_hstring(std::string(static_cast<char*>(args[1]))));
					properties.Artist(to_hstring(std::string(static_cast<char*>(args[2]))));
					updater.Update();
				});

			
			
		}
	}
	catch (std::exception& e)
	{
		return Utils::to_cstr_dyn(e.what());
	}

	return nullptr;
}

char* updateSMTCPlayState(void** args)
{
	try
	{
		int state = **(int**)args;

		SystemMediaTransportControls smtc = mediaPlayer->SystemMediaTransportControls();

		smtc.PlaybackStatus(static_cast<MediaPlaybackStatus>(state));
	}
	catch (std::exception& e)
	{
		return Utils::to_cstr_dyn(e.what());
	}

	return nullptr;
}

char* registerSMTCEventCallback(void** args)
{
	auto val = static_cast<cef_v8value_t*>(args[0]);
	callback = new BetterNCMNativePlugin::extensions::JSFunction(val);
	SystemMediaTransportControls smtc = mediaPlayer->SystemMediaTransportControls();
	smtc.IsEnabled(true);
	smtc.IsPlayEnabled(true);
	smtc.IsPauseEnabled(true);
	smtc.IsNextEnabled(true);
	smtc.IsPreviousEnabled(true);

	return nullptr;
}
