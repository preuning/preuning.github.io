date = null;
septaJSON = null;
markers = [];

trainData = [];

$(function () {

/*
Took this out so it could work without php running... using hard-coded values from trainJSON.js
*/
    $.ajax(getSeptaParams()).done(function(o) {
        septaJSON = JSON.parse(o);

        $.each(septaJSON, function (key, val) {
            date = key;
            $('#date_label').html("Septa locations as of " + date + ":");

            $.each(val, function (key2, val2) {
                $.each(val2, function (key3, val3) {
                    $.each(val3, function (key4, val4) {
                        trainNumber = val4.label
                        lat = val4.lat;
                        lng = val4.lng;
                        direction = val4.Direction;
                        destination = val4.destination;
                        trainData[trainNumber] = {lat:lat,lng:lng,direction:direction,destination:destination}
		            });
                });
            });
	    });

        var trainSelect = $('#train_selection');
        trainList = [];
        for (var train in trainData) {
            direction = trainData[train].direction;
            destination = trainData[train].destination;
            optValue = direction + " to " + destination + " (" + train + ")";
 
            if (direction != null && destination != null) {
                trainList.push(optValue);
                //trainSelect.append($('<option></option>').val(train).html(optValue));
            }
	    }
        $("#train_selection").autocomplete({ source: trainList });

        $("#train_selection").val("Search...");

        $("#train_selection").keyup(function(e) {
            if (e.keyCode == 13) {
                changeLocation();
            }
        })

        try {
            init_gmap();
        } catch (err) {
        }

    });


});

function getSeptaParams(start, end) {
    var septaParams = {
        type:"POST",
        dataType: 'json',
        url: "http://www3.septa.org/hackathon/TransitViewAll/"
    }
    
    return septaParams;
}

function focusTrainSearch() {
    $('#train_selection').val('');
}

function blurTrainSearch() {
    if ($('#train_selection').val() == '') {
       $('#train_selection').val('Search...');
    }
}

function init_gmap() {

    /* Called when page is first loaded */

    var mapCanvas = document.getElementById('map_area');
    var mapOptions = {
        center: new google.maps.LatLng(40.102139, -75.027145),
        zoom: 12,
        minZoom: 10,
        draggable: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        styles: 
        [{
            featureType: "all",
            elementType: "labels",        
            stylers: [
                { visibility: "off" }
            ]
        }],
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.LEFT_TOP
        },
        streetViewControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP
        }            
    }
    
    map = new google.maps.Map(mapCanvas, mapOptions);

    var markerSize = { x: 22, y: 40 };

    google.maps.Marker.prototype.setLabel = function(label) {

    markerStyle = "map-marker-label";

    if (label == null) {
        this.label.text = "";
	} else {
        this.label = new MarkerLabel({
            map: this.map,
            marker: this,
            text: label
        });
        this.label.div.className = markerStyle;
	}
        this.label.bindTo('position', this, 'position');
    };

    var MarkerLabel = function(options) {
        this.setValues(options);
        this.div = document.createElement('div');
    };

    MarkerLabel.prototype = $.extend(new google.maps.OverlayView(), {
        onAdd: function() {
            this.getPanes().overlayImage.appendChild(this.div);
            var self = this;
            this.listeners = [
		google.maps.event.addListener(this, 'position_changed', function() { self.draw();    })];
        },
        draw: function() {
            var text = String(this.get('text'));
            var position = this.getProjection().fromLatLngToDivPixel(this.get('position'));
            this.div.innerHTML = text;
            this.div.style.left = (position.x - (markerSize.x / 2)) - (text.length * 3) + 10 + 'px';
            this.div.style.top = (position.y - markerSize.y + 40) + 'px';
        }
    });

    geocoder = new google.maps.Geocoder();
} 

function changeLocation() {
    trainSelected = $('#train_selection').val();

    if (trainSelected == "") return;

    leftParenPos = trainSelected.indexOf('(') + 1;
    rightParenPos = trainSelected.indexOf(')');
    trainNumber = trainSelected.substring(leftParenPos, rightParenPos);

    lat = parseFloat(trainData[trainNumber].lat);
    lng = parseFloat(trainData[trainNumber].lng);
    direction = trainData[trainNumber].direction;
    destination = trainData[trainNumber].destination;
    
    showLatLng(lat, lng, direction + " to " + destination, trainNumber);

    $('#train_selection').blur();
}

function showLatLng(latParam, lngParam, labelParam, trainNumber) {

    var latlng = {lat: latParam, lng: lngParam};
    var image = "Transport-Train-icon.png";
    var tooltipText = "Train number: " + trainNumber;

    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        icon: image,
        label: labelParam,
        title: tooltipText
    });

    markers.push(marker);

    map.setCenter(latlng);
}

function clearMap() {

    for (markerIndex = 0; markerIndex < markers.length; markerIndex++) {
        markers[markerIndex].setLabel(null);
        markers[markerIndex].setMap(null);
    }
    markers = [];
}
